/// <reference types="vitest" />

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { sitemapPlugin } from './sitemapPlugin'

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss(),
    sitemapPlugin()
  ],
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        dead_code: true,
      },
    },
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('firebase')) return 'firebase';
          if (id.includes('leaflet')) return 'leaflet';
          if (id.includes('framer-motion')) return 'animations';
          if (id.includes('@ionic') || id.includes('ionicons')) return 'ionic';
          if (
            id.includes('/react/') || id.includes('/react-dom/') ||
            id.includes('/react-router') || id.includes('scheduler')
          ) return 'react-vendor';
        },
      },
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})