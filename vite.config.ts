/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'],
      workbox: { globPatterns: ['**/*.{js,css,html,png,json}'] },
      manifest: {
        name: 'Easy FX',
        short_name: 'Easy FX',
        description: '실제 과거 환율로 5분 만에 해보는 FX 모의투자',
        lang: 'ko',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        start_url: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test-setup.ts'] },
})
