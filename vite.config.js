import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api_ggsel': {
        target: 'https://seller.ggsel.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api_ggsel/, '')
      },
      '/api_dessly': {
        target: 'https://desslyhub.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api_dessly/, '')
      }
    }
  }
})
