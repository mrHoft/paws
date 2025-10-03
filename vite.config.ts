import { defineConfig } from 'vite'

const cwd = process.cwd();

export default defineConfig({
  build: {
    assetsDir: './',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  resolve: {
    alias: [
      {
        find: '~',
        replacement: `${cwd}/src/`,
      }
    ],
  },
})
