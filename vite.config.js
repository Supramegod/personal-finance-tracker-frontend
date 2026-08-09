import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  // Konfigurasi Vitest. Sengaja menumpang di vite.config.js (bukan file
  // vitest.config.js terpisah) supaya alias '@' dan plugin React otomatis
  // ikut terpakai di tes — kalau dipisah, keduanya harus diduplikasi.
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    // globals sengaja false; tiap tes mengimpor describe/it/expect eksplisit.
    globals: false,
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/test/**', 'src/main.jsx', 'src/lib/mockData.js'],
    },
  },
})
