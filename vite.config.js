// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/convert': {
        target: 'http://localhost:5001', // Flask 백엔드 주소
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
       
      },
    },
  },
})
