import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // "server-only" has no real package on disk; it's a Next.js build-time
      // guard with no meaning under vitest, so alias it to a no-op module.
      'server-only': fileURLToPath(
        new URL('./src/lib/__mocks__/server-only.ts', import.meta.url)
      ),
    },
  },
  test: {
    environment: 'jsdom',
  },
})