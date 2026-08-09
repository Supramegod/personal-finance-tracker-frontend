import { useEffect, useRef, useCallback, useId } from 'react'
import { cn } from '@/lib/utils'

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), summary, [contenteditable], [tabindex]:not([tabindex="-1"])'

/**
 * Dialog modal yang bisa diakses keyboard & screen reader.
 *
 * Modal yang ada di halaman lain ditulis manual sebagai div bertumpuk tanpa
 * `role`, tanpa tombol Esc, dan tanpa jebakan fokus — akibatnya Tab bisa keluar
 * ke halaman di belakang overlay dan pengguna keyboard tersesat. Komponen ini
 * menutup celah itu di satu tempat:
 *
 *   - `role="dialog"` + `aria-modal` + `aria-labelledby` ke judulnya
 *   - Esc menutup
 *   - fokus pindah ke dalam dialog saat dibuka, Tab berputar di dalamnya
 *   - fokus dikembalikan ke elemen pemicu saat ditutup
 *   - scroll body dikunci selama dialog terbuka
 *
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   title: string,
 *   children: React.ReactNode,
 *   maxWidth?: string,
 *   busy?: boolean,
 *   initialFocusRef?: React.RefObject<HTMLElement>,
 * }} props
 * `busy` mencegah penutupan tak sengaja (overlay/Esc) saat request berjalan.
 * `initialFocusRef` menentukan elemen yang difokus saat dibuka. Pakai ini
 * alih-alih `autoFocus` pada anak: React menerapkan `autoFocus` saat commit,
 * yaitu SEBELUM efek di bawah berjalan, sehingga `triggerRef` akan menangkap
 * elemen di dalam dialog dan fokus tidak pernah kembali ke pemicunya.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  busy = false,
  initialFocusRef,
}) {
  const panelRef = useRef(null)
  const titleId = useId()
  // Simpan pemicu supaya fokus bisa dikembalikan persis ke sana saat ditutup.
  const triggerRef = useRef(null)

  // onClose dan busy disimpan di ref, BUKAN dijadikan dependency efek di bawah.
  //
  // Pemanggil mengoper arrow inline (`onClose={() => onClose(false)}`), jadi
  // identitasnya baru di setiap render. Kalau efek focus-trap bergantung
  // padanya, efek itu teardown+setup ulang tiap render — dan setup-nya memaksa
  // fokus ke elemen pertama. Akibatnya fokus dirampas dari input pada setiap
  // ketikan dan form tidak bisa diisi. Ref membuat efeknya hanya bergantung
  // pada `open`, sementara handler tetap selalu yang terbaru.
  const onCloseRef = useRef(onClose)
  const busyRef = useRef(busy)
  const initialFocusRefRef = useRef(initialFocusRef)
  useEffect(() => {
    onCloseRef.current = onClose
    busyRef.current = busy
    initialFocusRefRef.current = initialFocusRef
  })

  const requestClose = useCallback(() => {
    if (!busyRef.current) onCloseRef.current()
  }, [])

  useEffect(() => {
    if (!open) return

    triggerRef.current = document.activeElement

    const panel = panelRef.current
    // Sengaja tanpa filter visibilitas: offsetParent selalu null di jsdom (tidak
    // ada layout) dan juga null untuk elemen position:fixed di browser, jadi
    // memfilternya justru mengosongkan daftar. Selector sudah mengecualikan
    // elemen disabled, dan dialog ini tidak menyembunyikan kontrol via CSS.
    const visibleFocusables = () => (panel ? [...panel.querySelectorAll(FOCUSABLE)] : [])

    const initial = initialFocusRefRef.current?.current
    // Kalau tidak ada elemen fokusabel, panelnya sendiri yang menerima fokus
    // (tabIndex={-1}) — jangan biarkan fokus tertinggal di belakang overlay.
    ;(initial || visibleFocusables()[0] || panel)?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        // Esc dari date-picker / select yang sedang terbuka menggelembung ke
        // sini; menutup dialog di situ akan membuang isian yang sedang dipilih.
        const target = event.target
        if (target?.tagName === 'SELECT' || target?.type === 'date') return
        event.stopPropagation()
        requestClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusables = visibleFocusables()
      if (focusables.length === 0) {
        event.preventDefault()
        panel?.focus()
        return
      }

      // Selalu ambil alih Tab, bukan hanya saat fokus ada di elemen pertama /
      // terakhir. Kalau fokus terlempar ke <body> — dan itu terjadi rutin di
      // fitur ini karena browser mem-blur tombol yang di-disable saat submit —
      // maka indexOf = -1 dan Tab native akan lolos ke konten di belakang
      // overlay.
      const index = focusables.indexOf(document.activeElement)
      event.preventDefault()
      const next = event.shiftKey
        ? focusables[index <= 0 ? focusables.length - 1 : index - 1]
        : focusables[index === -1 || index === focusables.length - 1 ? 0 : index + 1]
      next.focus()
    }

    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      // Elemen pemicu bisa saja sudah lepas dari DOM (mis. kartunya terhapus).
      if (triggerRef.current?.isConnected) triggerRef.current.focus()
    }
  }, [open, requestClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay murni dekoratif: penutupan lewat keyboard sudah lewat Esc,
          jadi jangan tawarkan ke pembaca layar sebagai kontrol tersendiri. */}
      <div className="absolute inset-0 bg-black/50" onClick={requestClose} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-white shadow-xl',
          'outline-none focus-visible:ring-2 focus-visible:ring-primary',
          maxWidth
        )}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-6">
          <h2 id={titleId} className="text-lg font-semibold text-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={requestClose}
            disabled={busy}
            aria-label="Tutup dialog"
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
