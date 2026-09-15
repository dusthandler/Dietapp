import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// Ruta base de despliegue: '/' en local y con dominio propio; '/Dietapp/' en GitHub Pages (ver .github/workflows/deploy.yml)
const base = process.env.VITE_BASE ?? '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Dietapp — tu nutrición sin pensar',
        short_name: 'Dietapp',
        description: 'Controla macros y micronutrientes de forma fácil, visual y rápida.',
        theme_color: '#FFF8F0',
        background_color: '#FFF8F0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        lang: 'es',
        categories: ['health', 'food', 'lifestyle'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        manualChunks: { react: ['react', 'react-dom', 'react-router-dom'], motion: ['framer-motion'], db: ['dexie', 'dexie-react-hooks'] },
      },
    },
  },
})
