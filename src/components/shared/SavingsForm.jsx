import { useState, useEffect, useId, useRef } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { createSavings, updateSavings } from '@/store/slices/savingsSlice'
import { toISODate, formatIDR, cn } from '@/lib/utils'
import Modal from '@/components/shared/Modal'
import CurrencyInput from '@/components/shared/CurrencyInput'

const EMPTY = {
  name: '',
  target_amount: '',
  target_date: '',
  note: '',
  status: 'active',
}

/**
 * Form buat / ubah pot tabungan.
 * `goal` diisi untuk mode ubah, biarkan null untuk mode buat.
 * `onClose(success)` — komponen induk yang me-refetch saat success.
 */
export default function SavingsForm({ open, goal, onClose }) {
  const dispatch = useAppDispatch()
  const fieldId = useId()
  const formRef = useRef(null)
  const isEdit = Boolean(goal)

  const [formData, setFormData] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setFormData(
      goal
        ? {
            name: goal.name ?? '',
            target_amount: goal.target_amount != null ? String(Math.round(goal.target_amount)) : '',
            target_date: goal.target_date ? toISODate(goal.target_date) : '',
            note: goal.note ?? '',
            status: goal.status ?? 'active',
          }
        : EMPTY
    )
    setErrors({})
  }, [open, goal])

  const target = Number(formData.target_amount) || 0

  const validate = () => {
    const e = {}
    if (!formData.name.trim()) e.name = 'Nama tabungan harus diisi'
    // Target opsional — hanya divalidasi kalau diisi.
    if (formData.target_amount !== '' && target <= 0) {
      e.target_amount = 'Target harus lebih dari 0, atau kosongkan saja'
    }
    if (formData.target_date && !formData.target_amount) {
      e.target_date = 'Isi target nominal dulu, atau kosongkan tanggalnya'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) {
      // Tanpa ini, pengguna screen reader menekan Simpan dan tidak mendengar
      // apa pun — dialognya tampak diam. `noValidate` mematikan pesan native.
      requestAnimationFrame(() => {
        formRef.current?.querySelector('[aria-invalid="true"]')?.focus()
      })
      return
    }

    const payload = {
      name: formData.name.trim(),
      // Target kosong dikirim null supaya tersimpan NULL, bukan 0.
      target_amount: formData.target_amount === '' ? null : target,
      // Tanggal tetap dikirim sebagai string kosong, bukan null: handler Go
      // menerimanya sebagai `string` dan parseOptionalDate memperlakukan ''
      // sebagai "tidak diisi" → tersimpan NULL. Mengosongkan tenggat yang
      // sudah pernah diisi tetap bekerja.
      target_date: formData.target_date || '',
      note: formData.note,
    }

    setSubmitting(true)
    try {
      if (isEdit) {
        await dispatch(updateSavings({ id: goal.id, ...payload, status: formData.status })).unwrap()
      } else {
        await dispatch(createSavings(payload)).unwrap()
      }
      onClose(true)
    } catch (err) {
      setErrors({ submit: err || 'Gagal menyimpan tabungan' })
    } finally {
      setSubmitting(false)
    }
  }

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
      title={isEdit ? 'Ubah Tabungan' : 'Tambah Tabungan'}
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        {errors.submit && (
          <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-expense-dark">
            {errors.submit}
          </div>
        )}

        {/* Nama */}
        <div>
          <label htmlFor={`${fieldId}-name`} className="mb-1 block text-sm font-medium text-text">
            Nama tabungan
          </label>
          <input
            id={`${fieldId}-name`}
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="mis. Dana Darurat"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${fieldId}-name-error` : undefined}
            className={inputClass(errors.name)}
          />
          {errors.name && (
            <p id={`${fieldId}-name-error`} role="alert" className="mt-1 text-xs text-expense-dark">
              {errors.name}
            </p>
          )}
        </div>

        {/* Target nominal + tenggat */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${fieldId}-target`} className="mb-1 block text-sm font-medium text-text">
              Target (Rp)
            </label>
            <CurrencyInput
              id={`${fieldId}-target`}
              value={formData.target_amount}
              onChange={(digits) => setFormData({ ...formData, target_amount: digits })}
              placeholder="Opsional"
              hasError={Boolean(errors.target_amount)}
              aria-invalid={Boolean(errors.target_amount)}
              aria-describedby={
                [errors.target_amount && `${fieldId}-target-error`, `${fieldId}-target-hint`]
                  .filter(Boolean)
                  .join(' ')
              }
            />
            {errors.target_amount && (
              <p id={`${fieldId}-target-error`} role="alert" className="mt-1 text-xs text-expense-dark">
                {errors.target_amount}
              </p>
            )}
          </div>
          <div>
            <label htmlFor={`${fieldId}-date`} className="mb-1 block text-sm font-medium text-text">
              Tercapai pada
            </label>
            <input
              id={`${fieldId}-date`}
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              aria-invalid={Boolean(errors.target_date)}
              aria-describedby={errors.target_date ? `${fieldId}-date-error` : undefined}
              className={inputClass(errors.target_date)}
            />
            {errors.target_date && (
              <p id={`${fieldId}-date-error`} role="alert" className="mt-1 text-xs text-expense-dark">
                {errors.target_date}
              </p>
            )}
          </div>
        </div>

        <p id={`${fieldId}-target-hint`} className="text-xs text-gray-500">
          Kosongkan target kalau ini celengan bebas tanpa angka akhir.
          {target > 0 && ` Target: ${formatIDR(target)}.`}
        </p>

        {/* Status — hanya saat mengubah */}
        {isEdit && (
          <div>
            <label htmlFor={`${fieldId}-status`} className="mb-1 block text-sm font-medium text-text">
              Status
            </label>
            <select
              id={`${fieldId}-status`}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="active">Aktif</option>
              <option value="completed">Tercapai</option>
              <option value="archived">Diarsipkan</option>
            </select>
          </div>
        )}

        {/* Catatan */}
        <div>
          <label htmlFor={`${fieldId}-note`} className="mb-1 block text-sm font-medium text-text">
            Catatan (opsional)
          </label>
          <textarea
            id={`${fieldId}-note`}
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            placeholder="Tambahkan catatan..."
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

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
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
