import { defineConfig } from 'vite'
export default defineConfig({
  ssr: { noExternal: ['jose'] },
  build: {
    ssr: 'server/start.ts',
    outDir: 'dist-server',
    target: 'node22',
    rolldownOptions: { output: { entryFileNames: 'start.mjs' } },
  },
})
