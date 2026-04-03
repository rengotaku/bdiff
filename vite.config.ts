import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'favicon.png',
        'logo.png',
        'fonts/*.woff2'
      ],
      manifest: {
        name: 'BDiff - File Comparison Tool',
        short_name: 'BDiff',
        description: 'Beautiful diff viewer for comparing files and text offline',
        theme_color: '#166534',
        background_color: '#f9fafb',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        navigateFallbackAllowlist: [/^\/(?!api)/]
      }
    })
  ],
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