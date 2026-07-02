# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup       # install deps + prisma generate + prisma migrate dev (first-time setup)
npm run dev          # start dev server (Next.js + Turbopack) on localhost:3000
npm run build        # production build
npm run start        # run production build
npm run lint         # next lint
npm test             # run full vitest suite
npm test -- <name>   # run a single test file or matching test, e.g. `npm test -- file-system`
npm run db:reset     # prisma migrate reset --force (drops and recreates SQLite db)
```

There is no separate typecheck script; `npm run build` (or `tsc --noEmit`) surfaces type errors.

Prisma schema is `prisma/schema.prisma` (SQLite, file at `prisma/dev.db`). The client is generated into `src/generated/prisma` (a non-default output path), not `node_modules/.prisma` — re-run `npx prisma generate` after schema changes.

An Anthropic API key is optional (`ANTHROPIC_API_KEY` in `.env`). Without one, `src/lib/provider.ts` swaps in a `MockLanguageModel` that returns scripted tool calls instead of calling Claude, so the app is fully runnable offline.

## Architecture

This is UIGen: an AI chat interface that generates React components into an in-memory virtual file system and renders them live in a sandboxed iframe. No generated files ever touch disk.

### Virtual file system is the core data model

`src/lib/file-system.ts` (`VirtualFileSystem`) implements a full in-memory file tree (create/read/update/delete/rename, directory listing, path normalization) plus text-editor-style operations (`viewFile`, `replaceInFile`, `insertInFile`) that mirror Anthropic's text-editor tool commands. It serializes to/from a plain `Record<string, FileNode>` for two purposes: persisting to the `Project.data` column (as JSON) and shipping over the wire to the `/api/chat` route on every request.

### Two client contexts drive the UI

- `FileSystemProvider` (`src/lib/contexts/file-system-context.tsx`) owns the single `VirtualFileSystem` instance for the session, exposes CRUD helpers, and — critically — `handleToolCall`, which applies an incoming AI tool call (`str_replace_editor` or `file_manager`) directly to the virtual FS and bumps a `refreshTrigger` used to re-render the preview/editor.
- `ChatProvider` (`src/lib/contexts/chat-context.tsx`) wraps the Vercel AI SDK's `useChat`, posting the serialized file system + `projectId` to `/api/chat` on every message, and wires `onToolCall` straight into `FileSystemProvider`'s `handleToolCall`. This is how model tool calls become file system mutations on the client.

### `/api/chat` route (`src/app/api/chat/route.ts`)

Reconstructs a server-side `VirtualFileSystem` from the posted files, then streams a response via `streamText` with two tools:
- `str_replace_editor` — Anthropic's provider-defined text-editor tool (`src/lib/tools/str-replace.ts`), backed by the FS's `viewFile`/`createFileWithParents`/`replaceInFile`/`insertInFile`.
- `file_manager` — a custom tool (`src/lib/tools/file-manager.ts`) for rename/delete.

On `onFinish`, if a `projectId` was supplied and the caller is authenticated, it persists the updated message list and serialized file system back to the `Project` row. Anonymous sessions and requests without a `projectId` are never persisted server-side.

The system prompt (in the route file) mandates a root `/App.jsx` default export, Tailwind-only styling, no HTML files, and `@/`-aliased imports — the live preview depends on these conventions.

`src/lib/provider.ts`'s `MockLanguageModel` counts prior tool messages to decide which scripted step to emit next (create component → enhance styling → create `App.jsx` → summarize). It's order-dependent, not prompt-driven — if you change the tool-calling flow, the mock's step logic likely needs updating too.

### Live preview (no bundler, no disk writes)

`src/components/preview/PreviewFrame.tsx` + `src/lib/transform/jsx-transformer.ts` implement the preview entirely in-browser:
1. Each `.jsx`/`.tsx`/`.js`/`.ts` file is transpiled with `@babel/standalone` (React + TypeScript presets).
2. Transpiled output is wrapped in a `Blob` and given a `blob:` URL.
3. An ESM import map is built mapping every file's path (with and without leading slash, with and without `@/` prefix, with and without extension) to its blob URL; unresolved local imports get an auto-generated placeholder module so the preview doesn't hard-crash; bare package imports are proxied through `esm.sh`.
4. The resulting HTML (import map + Tailwind CDN script + an error boundary) is injected into a sandboxed iframe via `srcdoc`.

Entry point resolution checks `/App.jsx`, `/App.tsx`, `/index.jsx`, `/index.tsx`, `/src/App.jsx`, `/src/App.tsx` in that order, falling back to the first `.jsx`/`.tsx` file found.

### Auth

Custom JWT session auth (not NextAuth): `src/lib/auth.ts` signs/verifies a `jose` JWT stored in an `auth-token` httpOnly cookie. `src/middleware.ts` only gates `/api/projects` and `/api/filesystem` (the `/api/chat` route itself is not gated — persistence there is conditional on `getSession()` inside the handler). Server actions for sign up/in/out live in `src/actions/index.ts`.

### Anonymous work

Unauthenticated users can generate components without an account; `ChatProvider` mirrors in-progress work into `sessionStorage` via `src/lib/anon-work-tracker.ts`. `src/hooks/use-auth.ts`'s `handlePostSignIn` checks for stashed anonymous work right after sign in/up and, if present, converts it into a real `Project` and redirects there instead of the user's most recent project.

### Routing

`src/app/page.tsx` — authenticated users are redirected to their most recent project (or a freshly created one); anonymous users render `MainContent` with no project. `src/app/[projectId]/page.tsx` — loads a specific project (redirects home on missing/unauthorized access). Both routes render the same `MainContent` (`src/app/main-content.tsx`), which lays out the resizable chat / preview-or-code panels and wraps everything in `FileSystemProvider` > `ChatProvider`.

### Styling conventions

Design tokens (colors, radius) live in `src/app/globals.css` as CSS custom properties consumed via Tailwind v4's `@theme inline`; shadcn/ui components are configured "new-york" style with a `@/` alias set in `components.json`. The current accent is violet/indigo. Buttons use solid accent colors, not gradients — keep new UI consistent with that.

### Development Best Practices

- Use comments sparingly. Only comment complex code.

### Database

- The database schema is defined in the @prisma/schema.prisma file. Reference it anytime you need to understand the structure of data stored in the database.