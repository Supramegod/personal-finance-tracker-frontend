import { useState, useEffect, useId, useRef } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { depositSavings, withdrawSavings } from '@/store/slices/savingsSlice'
import { toISODate, formatIDR, cn } from '@/lib/utils'
import Modal from '@/components/shared/Modal'
import CurrencyInput from '@/components/shared/CurrencyInput'

/**
 * Dialog setor / tarik tabungan.
 *
 * @param {{
 *   open: boolean,
 *   mode: 'deposit' | 'withdraw',
 *   goal: object | null,
 *   cashBalance: number,
 *   onClose: (success: boolean) => void,
 * }} props
 */
export default function SavingsEntryDialog({ open, mode, goal, cashBalance, onClose }) {
  const dispatch = useAppDispatch()
  const fieldId = useId()
  // Dipakai sebagai initialFocusRef Modal. `autoFocus` tidak bisa dipakai:
  // React menerapkannya saat commit, sebelum efek Modal berjalan, sehingga
  // Modal menangkap input ini sebagai "pemicu" dan fokus tak pernah kembali
  // ke tombol Setor/Tarik saat dialog ditutup.
  const amountRef = useRef(null)
  const isWithdraw = mode === 'withdraw'

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => toISODate(new Date()))
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setAmount('')
    setDate(toISODate(new Date()))
    setNote('')
    setErrors({})
  }, [open, mode, goal])

  const value = Number(amount) || 0
  const saved = goal?.saved_amount ?? 0

  // Setoran melebihi saldo kas hanya DIPERINGATKAN, tidak diblokir: saldo di
  // aplikasi belum tentu mencerminkan semua uang yang dipegang user.
  const exceedsCash = !isWithdraw && value > 0 && value > cashBalance

  const validate = () => {
    const e = {}
    if (!amount || value <= 0) e.amount = 'Nominal harus lebih dari 0'
    // Penarikan melebihi saldo pot ditolak keras — backend juga menolaknya,
    // ini sekadar supaya user tahu sebelum request dikirim.
    else if (isWithdraw && value > saved) {
      e.amount = `Melebihi saldo tabungan (${formatIDR(saved)})`
    }
    if (!date) e.date = 'Pilih tanggal'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return

    const thunk = isWithdraw ? withdrawSavings : depositSavings
    setSubmitting(true)
    try {
      await dispatch(thunk({ id: goal.id, amount: value, date, note: note.trim() })).unwrap()
      onClose(true)
    } catch (err) {
      setErrors({ submit: err || 'Gagal menyimpan mutasi' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!goal) return null

  const inputClass = (hasError) =>
    cn(
      'w-full rounded-lg border px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary',
      hasError ? 'border-expense' : 'border-gray-300'
    )

  return (
    <Modal
      open={open}
      onClose={() => onClose(false)}
      busy={submitting}
      maxWidth="max-w-sm"
      initialFocusRef={amountRef}
      title={isWithdraw ? `Tarik dari ${goal.name}` : `Setor ke ${goal.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        {errors.submit && (
          <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-expense-dark">
            {errors.submit}
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
          <span className="text-gray-500">{isWithdraw ? 'Saldo tabungan' : 'Saldo kas'}</span>
          <span className="font-semibold text-text">
            {formatIDR(isWithdraw ? saved : cashBalance)}
          </span>
        </div>

        <div>
          <label htmlFor={`${fieldId}-amount`} className="mb-1 block text-sm font-medium text-text">
            Nominal (Rp)
          </label>
          <CurrencyInput
            id={`${fieldId}-amount`}
            value={amount}
            onChange={setAmount}
            placeholder="0"
            ref={amountRef}
            hasError={Boolean(errors.amount)}
            aria-invalid={Boolean(errors.amount)}
            aria-describedby={
              [errors.amount && `${fieldId}-amount-error`, exceedsCash && `${fieldId}-amount-warning`]
                .filter(Boolean)
                .join(' ') || undefined
            }
          />
          {errors.amount && (
            <p id={`${fieldId}-amount-error`} role="alert" className="mt-1 text-xs text-expense-dark">
              {errors.amount}
            </p>
          )}
        </div>

        {exceedsCash && (
          <p
            id={`${fieldId}-amount-warning`}
            role="status"
            className="rounded-lg bg-warning-light px-3 py-2 text-xs text-warning"
          >
            Nominal ini melebihi saldo kas tercatat. Tetap bisa disimpan — mungkin
            ada uang yang belum tercatat di aplikasi.
          </p>
        )}

        <div>
          <label htmlFor={`${fieldId}-date`} className="mb-1 block text-sm font-medium text-text">
            Tanggal
          </label>
          <input
            id={`${fieldId}-date`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={Boolean(errors.date)}
            aria-describedby={errors.date ? `${fieldId}-date-error` : undefined}
            className={inputClass(errors.date)}
          />
          {errors.date && (
            <p id={`${fieldId}-date-error`} role="alert" className="mt-1 text-xs text-expense-dark">
              {errors.date}
            </p>
          )}
        </div>

        <div>
          <label htmlFor={`${fieldId}-note`} className="mb-1 block text-sm font-medium text-text">
            Catatan (opsional)
          </label>
          <input
            id={`${fieldId}-note`}
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={isWithdraw ? 'mis. servis motor' : 'mis. sisa gajian'}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <p id={`${fieldId}-hint`} className="text-xs text-gray-500">
          {isWithdraw
            ? 'Penarikan mengembalikan uang ke saldo kas dan tercatat sebagai transfer, bukan pemasukan.'
            : 'Setoran mengurangi saldo kas dan tercatat sebagai transfer, bukan pengeluaran — laporan tidak terpengaruh.'}
        </p>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => onClose(false)}
            disabled={submitting}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {submitting ? 'Menyimpan...' : isWithdraw ? 'Tarik' : 'Setor'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
