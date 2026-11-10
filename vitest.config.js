import { defineConfig } from 'vitest/config'

// Vitest 3 bundles its own Vite 7, which @vitejs/plugin-react 6 does not support,
// so tests compile JSX with esbuild's automatic runtime instead of the React plugin.
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: {
    // Library tests run in Node, which provides globalThis.crypto.subtle.
    // Component tests opt into jsdom with a comment at the top of the file.
    environment: 'node',
    setupFiles: ['./src/setupTests.js'],
  },
})
