import { useEffect, useRef, useId } from 'react'

/**
 * Dialog konfirmasi untuk aksi destruktif.
 *
 * Tampilannya sengaja tidak diubah — hanya semantiknya yang dilengkapi:
 * `role="alertdialog"`, Esc, fokus awal ke tombol Batal (opsi paling aman),
 * dan fokus dikembalikan ke pemicu saat ditutup. Sebelumnya ini div bertumpuk
 * tanpa role apa pun, padahal dipakai untuk aksi paling berbahaya di dua
 * halaman (hapus cicilan dan hapus tabungan).
 *
 * Focus trap penuh belum ada di sini; untuk itu komponen ini perlu dibangun
 * ulang di atas `Modal.jsx` — perubahan tampilan yang di luar lingkup sekarang.
 */
export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Ya, Hapus', isLoading }) {
  const titleId = useId()
  const messageId = useId()
  const cancelRef = useRef(null)
  const triggerRef = useRef(null)

  // Sama seperti Modal: handler disimpan di ref supaya efek hanya bergantung
  // pada `open` dan tidak teardown ulang tiap render pemanggil.
  const closeRef = useRef(onClose)
  const loadingRef = useRef(isLoading)
  useEffect(() => {
    closeRef.current = onClose
    loadingRef.current = isLoading
  })

  useEffect(() => {
    if (!open) return

    triggerRef.current = document.activeElement
    // Fokus ke Batal, bukan ke tombol hapus — jangan menaruh kursor pengguna
    // keyboard tepat di atas aksi destruktifnya.
    cancelRef.current?.focus()

    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      if (!loadingRef.current) closeRef.current()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (triggerRef.current?.isConnected) triggerRef.current.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !isLoading && onClose()}
        aria-hidden="true"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
      >
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-expense-light flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-expense-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 id={titleId} className="text-lg font-semibold text-text mb-2">{title}</h3>
          <p id={messageId} className="text-sm text-gray-600">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            ref={cancelRef}
            onClick={() => onClose()}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-lg bg-expense text-sm font-semibold text-white hover:bg-expense-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isLoading ? 'Menghapus...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
