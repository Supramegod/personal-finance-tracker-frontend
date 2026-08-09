import { useRef, useLayoutEffect, useState } from 'react'
import { parseIDRInput, formatIDRInput, cn } from '@/lib/utils'

/**
 * Input nominal rupiah dengan pemisah ribuan yang muncul saat diketik.
 *
 * Kenapa bukan `type="number"`: input number tidak bisa menampilkan pemisah
 * ribuan sama sekali, sehingga "1500000" harus dihitung nolnya satu per satu.
 * Di sini dipakai `type="text"` + `inputMode="numeric"` — keyboard ponsel tetap
 * numerik, tapi tampilannya bisa diformat.
 *
 * `value` dan `onChange` bekerja dengan STRING DIGIT POLOS ('1500000'), bukan
 * teks terformat. Jadi form pemanggil tidak perlu tahu soal pemisah ribuan dan
 * `Number(value)` tetap bisa dipakai apa adanya.
 *
 * @param {{
 *   value: string,
 *   onChange: (digits: string) => void,
 *   hasError?: boolean,
 *   ref?: React.Ref<HTMLInputElement>,
 * }} props
 */
export default function CurrencyInput({
  value,
  onChange,
  hasError = false,
  className,
  ref,
  ...rest
}) {
  const innerRef = useRef(null)
  // Posisi kursor yang harus dipulihkan setelah render, dihitung dalam JUMLAH
  // DIGIT (bukan indeks karakter) — indeks karakter bergeser setiap kali
  // pemisah ribuan muncul atau hilang.
  const [caretDigits, setCaretDigits] = useState(null)

  const setRefs = (node) => {
    innerRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  const display = formatIDRInput(value)

  useLayoutEffect(() => {
    if (caretDigits === null) return
    const input = innerRef.current
    if (!input) return

    // Maju melewati teks terformat sampai sudah melewati caretDigits digit.
    let seen = 0
    let position = display.length
    for (let i = 0; i < display.length; i++) {
      if (seen === caretDigits) {
        position = i
        break
      }
      if (/\d/.test(display[i])) seen++
    }
    if (seen === caretDigits && caretDigits === 0) position = 0

    input.setSelectionRange(position, position)
    setCaretDigits(null)
  }, [caretDigits, display])

  const handleChange = (event) => {
    const raw = event.target.value
    const selection = event.target.selectionStart ?? raw.length
    // Berapa digit yang ada SEBELUM kursor — itulah jangkar yang stabil.
    const digitsBeforeCaret = raw.slice(0, selection).replace(/\D/g, '').length

    setCaretDigits(digitsBeforeCaret)
    onChange(parseIDRInput(raw))
  }

  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
        aria-hidden="true"
      >
        Rp
      </span>
      <input
        ref={setRefs}
        // text + inputMode numeric: keyboard ponsel tetap angka, tapi pemisah
        // ribuan bisa ditampilkan (type="number" akan menolaknya).
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={handleChange}
        className={cn(
          'w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm tabular-nums',
          'focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary',
          hasError ? 'border-expense' : 'border-gray-300',
          className
        )}
        {...rest}
      />
    </div>
  )
}
