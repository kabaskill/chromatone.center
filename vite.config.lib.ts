import { defineConfig } from 'vite'
import { resolve } from 'path'


import path from "node:path";
import { fileURLToPath } from "node:url";

//@ts-expect-error
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);


export default defineConfig({
  plugins: [
  ],
  optimizeDeps: {
    include: ['vue', '@vueuse/core', 'tone', '@tonaljs/tonal', 'colord'],
  },
  publicDir: false,
  resolve: {
    alias: {
      "#": path.resolve(dirname, ".vitepress/"),
    }
  },
  build: {
    outDir: "lib",
    lib: {
      entry: resolve(dirname, '.vitepress/use/index.ts'),
      name: 'use-chromatone',
      fileName: 'use-chromatone',
      formats: ["es"],
    },
    chunkSizeWarningLimit: 100000,
    rollupOptions: {
      external: ['vue'],
      output: {
        manualChunks: {
          tone: ['tone']
        },
      },
    },
  },
})