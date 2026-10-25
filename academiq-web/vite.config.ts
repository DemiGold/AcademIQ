import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'AcademIQ',
        short_name: 'AcademIQ',
        description: 'Practice past-question-style exams for UNILAG in a real CBT environment.',
        theme_color: '#1A5276',
        background_color: '#0A1628',
        display: 'standalone',
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        // Using a function prevents the TypeScript type mismatch
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (
              id.includes('lucide-react') || 
              id.includes('@tanstack') || 
              id.includes('react-hook-form') || 
              id.includes('@hookform') ||
              id.includes('zod') || 
              id.includes('zustand')
            ) {
              return 'ui-vendor';
            }
            // Everything else from node_modules goes into a generic vendor chunk
            return 'vendor';
          }
        }
      }
    }
  }
})
