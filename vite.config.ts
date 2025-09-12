import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 14000,
    host: '0.0.0.0',
    strictPort: false,
    allowedHosts: [
      'localhost',
      '.localhost',
      'gpuserver.lan',
      '.gpuserver.lan',
      '192.168.2.40',
      '.local'
    ],
    cors: {
      origin: [
        'http://localhost:14000',
        'http://gpuserver.lan:14000',
        'http://192.168.2.40:14000'
      ],
      credentials: true
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: '[name].[hash].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[hash].[ext]'
      }
    }
  }
})