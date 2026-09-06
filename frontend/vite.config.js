import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/ws-token': {
        target: 'http://localhost:8083',
        ws: true,
        changeOrigin: true
      }
    }
  },
  define: {
    global: 'window'
  }
})
