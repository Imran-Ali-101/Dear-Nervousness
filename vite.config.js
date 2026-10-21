import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    // Silence the large chunk warning (face analysis library is big)
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The app updates itself when a new version is deployed
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'logo.svg'],
      manifest: {
        name: 'Dear Nervousness',
        short_name: 'Nervousness',
        description: 'Practice interviews and speaking with an AI coach in Bengali and English.',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Skip minifying the service worker (this step hangs on some setups)
        mode: 'development',
        // Single page app: unknown routes open index.html, but never the API
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // The main bundle is large because of the face analysis library
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})