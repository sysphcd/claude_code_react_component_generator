# UIGen

AI-powered React component generator with live preview.

## Prerequisites

- Node.js 18+
- npm

## Setup

1. **Optional** Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your-api-key-here
```

The project will run without an API key. Rather than using a LLM to generate components, static code will be returned instead.

2. Install dependencies and initialize database

```bash
npm run setup
```

This command will:

- Install all dependencies
- Generate Prisma client
- Run database migrations

## Running the Application

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Sign up or continue as anonymous user
2. Describe the React component you want to create in the chat
3. View generated components in real-time preview
4. Switch to Code view to see and edit the generated files
5. Continue iterating with the AI to refine your components

## Features

- AI-powered component generation using Claude
- Live preview with hot reload
- Virtual file system (no files written to disk)
- Syntax highlighting and code editor
- Component persistence for registered users
- Export generated code

## Design

The UI uses a violet/indigo accent theme defined via CSS custom properties in `src/app/globals.css`, applied consistently across the chat panel, code editor, file tree, preview empty states, and auth dialog. Buttons use solid accent colors (no gradients) to keep the interface understated.

The chat empty state (`ChatInterface.tsx`) is rendered outside the `ScrollArea` and vertically centered in the panel, since Radix's `ScrollArea` viewport sizes to content and can't center a child against the panel's full height.

## Tech Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma with SQLite
- Anthropic Claude AI
- Vercel AI SDK

## Prompt History

Prompts entered during AI-assisted development of this project, in order:

1. "open the app up in the browser and iterate on the styling a few times. Go for a sleek modern design."
2. "hold off on gradients on buttons in general and keep changes more subtle"
3. "update readme.md file to inculde what i've done so far"
4. "can you memorize to use comments sparingly. Only comment complex code."
5. "how does the auth system work? @src/components/auth/AuthDialog.tsx @src/hooks/use-auth.ts @src/lib/auth.ts"
6. "what attributes does a user have?"
7. "start the server"
8. "center this content vertically. update readme.md file for this change."
9. "replace the 'str_replace_editor' text with a more user friendly message of what this tool call is doing. for example, maybe state that a file is being created or edited, along with the name of the file being modified. Also, put this into a new component and write tests for it. Update readme.md file with all the prompt i've entered."
