// Setup global untuk Vitest — dimuat lewat `test.setupFiles` di vite.config.js.
//
// Dua hal yang diurus di sini:
//   1. Matcher jest-dom (toBeInTheDocument, toHaveClass, dst) didaftarkan ke
//      expect milik Vitest.
//   2. cleanup() dipanggil manual setelah tiap tes. RTL hanya auto-cleanup
//      kalau `globals: true`; konfigurasi ini sengaja tanpa globals supaya
//      setiap tes mengimpor describe/it/expect secara eksplisit.

import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

afterEach(() => {
  cleanup()
})
