import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/main.jsx', 
        './src/components/Sidebar.jsx'
      ],
    }
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'lucide-react', 
      'react-big-calendar',
      'date-fns',
      'axios'
    ],
    holdUntilCrawlEnd: false,
  }
})
