// academiq-web/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'], // Your existing favicon
      manifest: {
        name: 'AcademIQ',
        short_name: 'AcademIQ',
        description: 'Practice CBT for UNILAG',
        theme_color: '#1A5276',
        background_color: '#0A1628',
        display: 'standalone', // Hides browser UI
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});