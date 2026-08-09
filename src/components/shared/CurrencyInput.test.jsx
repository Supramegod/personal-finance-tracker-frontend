import { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CurrencyInput from '@/components/shared/CurrencyInput'

// Harness terkontrol: CurrencyInput dipakai sebagai controlled input di semua
// form, jadi mengujinya tanpa state induk tidak mencerminkan pemakaian nyata.
function Harness({ initial = '', onChange = () => {} }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <label htmlFor="nominal">Nominal</label>
      <CurrencyInput
        id="nominal"
        value={value}
        onChange={(digits) => {
          setValue(digits)
          onChange(digits)
        }}
      />
    </>
  )
}

describe('CurrencyInput', () => {
  it('menyisipkan pemisah ribuan saat diketik', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const input = screen.getByLabelText('Nominal')
    await user.type(input, '250000')

    // Inilah inti masalahnya: tanpa ini user harus menghitung nol satu per satu.
    expect(input).toHaveValue('250.000')
  })

  it('meneruskan digit polos ke pemanggil, bukan teks terformat', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    await user.type(screen.getByLabelText('Nominal'), '1500000')

    // Form memakai Number(value); titik pemisah tidak boleh ikut bocor.
    expect(onChange).toHaveBeenLastCalledWith('1500000')
  })

  it('memformat ulang pemisah saat digit ditambahkan di ujung', async () => {
    const user = userEvent.setup()
    render(<Harness initial="250000" />)

    const input = screen.getByLabelText('Nominal')
    expect(input).toHaveValue('250.000')

    await user.type(input, '0')

    expect(input).toHaveValue('2.500.000')
  })

  it('menerima tempelan teks yang sudah berformat rupiah', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness onChange={onChange} />)

    const input = screen.getByLabelText('Nominal')
    await user.click(input)
    await user.paste('Rp 1.500.000')

    expect(input).toHaveValue('1.500.000')
    expect(onChange).toHaveBeenLastCalledWith('1500000')
  })

  it('mengabaikan huruf', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    const input = screen.getByLabelText('Nominal')
    await user.type(input, '12abc34')

    expect(input).toHaveValue('1.234')
  })

  it('mengosongkan field saat semua digit dihapus', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Harness initial="5000" onChange={onChange} />)

    const input = screen.getByLabelText('Nominal')
    await user.clear(input)

    // String kosong, bukan '0' — form membedakan "belum diisi" dari nol.
    expect(input).toHaveValue('')
    expect(onChange).toHaveBeenLastCalledWith('')
  })

  it('menampilkan prefix Rp yang tidak ikut dibaca pembaca layar', () => {
    render(<Harness initial="250000" />)

    const prefix = screen.getByText('Rp')
    expect(prefix).toHaveAttribute('aria-hidden', 'true')
    // Label "Nominal (Rp)" sudah menyebut mata uangnya; prefix ini visual saja.
    expect(screen.getByLabelText('Nominal')).toHaveValue('250.000')
  })

  it('memakai keyboard numerik di ponsel tanpa memakai type=number', () => {
    render(<Harness />)

    const input = screen.getByLabelText('Nominal')
    expect(input).toHaveAttribute('inputmode', 'numeric')
    // type="number" tidak bisa menampilkan pemisah ribuan sama sekali.
    expect(input).toHaveAttribute('type', 'text')
  })

  it('menjaga kursor tetap di posisi digit yang sama saat menyunting di tengah', async () => {
    const user = userEvent.setup()
    render(<Harness initial="1000000" />)

    const input = screen.getByLabelText('Nominal')
    expect(input).toHaveValue('1.000.000')

    // Taruh kursor tepat setelah digit pertama, lalu ketik '2'.
    input.focus()
    input.setSelectionRange(1, 1)
    await user.keyboard('2')

    expect(input).toHaveValue('12.000.000')
    // Kursor harus berada setelah "12", bukan melompat ke ujung.
    expect(input.selectionStart).toBe(2)
  })
})
