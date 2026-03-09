import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      base: '/hours-tracker-pro/',
      scope: '/hours-tracker-pro/',
      manifest: {
        name: 'Hours Tracker Pro',
        short_name: 'Hours',
        description: 'Track your work hours, earnings and taxes',
        start_url: '/hours-tracker-pro/',
        scope: '/hours-tracker-pro/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#111118',
        theme_color: '#111118',
        icons: [
          {
            src: '/hours-tracker-pro/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/hours-tracker-pro/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/hours-tracker-pro/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  base: '/hours-tracker-pro/',
})
