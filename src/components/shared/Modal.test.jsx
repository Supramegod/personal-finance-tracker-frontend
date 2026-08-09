import { useState, useRef } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from '@/components/shared/Modal'

// Modal ini menggantikan tujuh modal manual yang tidak menahan fokus. Perilaku
// yang diuji di sini justru yang paling mudah rusak diam-diam saat refactor:
// tanpa tes, focus trap yang bocor tidak akan ketahuan sampai ada yang mencoba
// memakai keyboard.

function Harness({ open = true, onClose = () => {}, busy = false }) {
  return (
    <Modal open={open} onClose={onClose} busy={busy} title="Tambah Tabungan">
      <div className="p-6">
        <button type="button">Pertama</button>
        <button type="button">Terakhir</button>
      </div>
    </Modal>
  )
}

describe('Modal', () => {
  it('tidak merender apa pun saat tertutup', () => {
    render(<Harness open={false} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('mengekspos role dialog, aria-modal, dan judul yang tertaut', () => {
    render(<Harness />)

    const dialog = screen.getByRole('dialog', { name: 'Tambah Tabungan' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('heading', { name: 'Tambah Tabungan' })).toBeInTheDocument()
  })

  it('memberi tombol tutup ikon-saja label yang bisa dibaca', () => {
    render(<Harness />)

    expect(screen.getByRole('button', { name: 'Tutup dialog' })).toBeInTheDocument()
  })

  it('memindahkan fokus ke elemen fokusabel pertama saat dibuka', () => {
    render(<Harness />)

    expect(screen.getByRole('button', { name: 'Tutup dialog' })).toHaveFocus()
  })

  it('menutup saat Escape ditekan', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)

    await user.keyboard('{Escape}')

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('mengabaikan Escape selagi request berjalan', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness onClose={onClose} busy />)

    await user.keyboard('{Escape}')

    expect(onClose).not.toHaveBeenCalled()
  })

  it('memutar fokus kembali ke awal saat Tab dari elemen terakhir', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const close = screen.getByRole('button', { name: 'Tutup dialog' })
    const last = screen.getByRole('button', { name: 'Terakhir' })

    last.focus()
    await user.tab()

    // Tanpa trap, fokus akan lolos ke <body> / halaman di belakang overlay.
    expect(close).toHaveFocus()
  })

  it('memutar fokus ke elemen terakhir saat Shift+Tab dari elemen pertama', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const close = screen.getByRole('button', { name: 'Tutup dialog' })
    const last = screen.getByRole('button', { name: 'Terakhir' })

    close.focus()
    await user.tab({ shift: true })

    expect(last).toHaveFocus()
  })

  it('mengembalikan fokus ke elemen pemicu saat ditutup', async () => {
    function App() {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Buka
          </button>
          <Modal open={open} onClose={() => setOpen(false)} title="Tambah Tabungan">
            <div className="p-6">
              <button type="button">Pertama</button>
            </div>
          </Modal>
        </>
      )
    }

    const user = userEvent.setup()
    render(<App />)

    const trigger = screen.getByRole('button', { name: 'Buka' })
    await user.click(trigger)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tutup dialog' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('tidak merampas fokus dari input saat pemanggil me-render ulang dengan handler baru', async () => {
    // Regresi: pemanggil mengoper `onClose={() => onClose(false)}` — identitas
    // baru tiap render. Saat efek focus-trap masih bergantung pada handler itu,
    // setiap ketikan memicu teardown+setup dan fokus melompat ke tombol tutup,
    // membuat form mustahil diisi.
    function App() {
      const [value, setValue] = useState('')
      return (
        <Modal open onClose={() => {}} title="Tambah Tabungan">
          <div className="p-6">
            <label htmlFor="nominal">Nominal</label>
            <input id="nominal" value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
        </Modal>
      )
    }

    const user = userEvent.setup()
    render(<App />)

    const input = screen.getByLabelText('Nominal')
    await user.click(input)
    await user.keyboard('250000')

    expect(input).toHaveFocus()
    expect(input).toHaveValue('250000')
  })

  it('menarik fokus kembali ke dalam dialog saat Tab ditekan dari luar panel', async () => {
    // Fokus jatuh ke <body> secara rutin di fitur ini: browser mem-blur tombol
    // yang di-disable saat submit, dan baris yang sedang difokus hilang setelah
    // refetch. Trap yang hanya menjaga elemen pertama/terakhir akan membiarkan
    // Tab berikutnya lolos ke konten di belakang overlay.
    const user = userEvent.setup()
    render(
      <>
        <button type="button">LatarBelakang</button>
        <Harness />
      </>
    )

    // body tidak fokusabel, jadi body.focus() no-op — blur elemen aktif yang
    // sebenarnya, persis seperti browser saat tombol di-disable.
    document.activeElement.blur()
    expect(document.activeElement).toBe(document.body)

    await user.tab()

    expect(screen.getByRole('button', { name: 'Tutup dialog' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'LatarBelakang' })).not.toHaveFocus()
  })

  it('memfokuskan initialFocusRef alih-alih elemen fokusabel pertama', () => {
    function App() {
      const inputRef = useRef(null)
      return (
        <Modal open onClose={() => {}} title="Setor" initialFocusRef={inputRef}>
          <div className="p-6">
            <label htmlFor="nominal">Nominal</label>
            <input id="nominal" ref={inputRef} />
          </div>
        </Modal>
      )
    }

    render(<App />)

    expect(screen.getByLabelText('Nominal')).toHaveFocus()
  })

  it('tetap mengembalikan fokus ke pemicu meski memakai initialFocusRef', async () => {
    function App() {
      const [open, setOpen] = useState(false)
      const inputRef = useRef(null)
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Setor
          </button>
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title="Setor"
            initialFocusRef={inputRef}
          >
            <div className="p-6">
              <label htmlFor="nominal2">Nominal</label>
              <input id="nominal2" ref={inputRef} />
            </div>
          </Modal>
        </>
      )
    }

    const user = userEvent.setup()
    render(<App />)

    const trigger = screen.getByRole('button', { name: 'Setor' })
    await user.click(trigger)
    expect(screen.getByLabelText('Nominal')).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Tutup dialog' }))

    // autoFocus pada anak akan merusak ini: React menerapkannya sebelum efek
    // Modal berjalan, jadi triggerRef menangkap input, bukan tombol pemicu.
    expect(trigger).toHaveFocus()
  })

  it('mengunci scroll body selagi terbuka dan memulihkannya saat ditutup', () => {
    const { unmount } = render(<Harness />)
    expect(document.body.style.overflow).toBe('hidden')

    unmount()

    expect(document.body.style.overflow).toBe('')
  })
})
