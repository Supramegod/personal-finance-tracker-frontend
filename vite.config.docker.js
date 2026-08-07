// ============================================================
// Konfigurasi Vite khusus container (stack lokal Docker)
// ============================================================
// Meng-extend vite.config.js — plugin, alias '@', dan seluruh pengaturan
// build tetap dari sana. Hanya blok `server` yang ditimpa, karena tiga hal
// berperilaku berbeda di dalam container:
//
//   1. host      Harus 0.0.0.0. Default Vite hanya mengikat localhost, yang
//                di dalam container berarti tidak terjangkau dari host.
//   2. proxy     Target 'http://localhost:8080' dari config asli menunjuk ke
//                container INI sendiri, bukan backend. Diarahkan ke 'api',
//                nama service di network compose.
//   3. watch     Bind mount tidak meneruskan event inotify secara andal di
//                Linux/WSL/macOS, jadi file watcher dipaksa polling.
//
// Dipakai lewat: npx vite --config vite.config.docker.js
// ============================================================

import { defineConfig, mergeConfig } from 'vite'

import baseConfig from './vite.config.js'

export default mergeConfig(
  baseConfig,
  defineConfig({
    server: {
      host: '0.0.0.0',
      port: 5173,
      // Dipakai hanya ketika Vite diakses langsung di http://localhost:5173.
      // Melalui nginx (http://localhost:8000) request /api/v1 tidak pernah
      // sampai ke sini — nginx yang meneruskannya lebih dulu.
      proxy: {
        '/api': {
          target: 'http://api:8080',
          changeOrigin: true,
        },
      },
      // Klien HMR menyambung ke localhost:5173, yang dipublikasikan ke host
      // oleh compose. Ini membuat hot reload tetap hidup baik saat halaman
      // dibuka lewat nginx (8000) maupun langsung (5173).
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        clientPort: 5173,
      },
      watch: {
        usePolling: true,
        interval: 300,
      },
    },
  }),
)
