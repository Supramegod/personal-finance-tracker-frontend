import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchCategories } from '@/store/slices/categorySlice'
import { createInstallment } from '@/store/slices/installmentSlice'
import { toISODate, formatIDR, cn } from '@/lib/utils'

export default function InstallmentForm({ open, onClose }) {
  const dispatch = useAppDispatch()
  const { items: categories } = useAppSelector((state) => state.categories)

  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    monthly_amount: '',
    tenor_months: '',
    start_date: toISODate(new Date()),
    note: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  useEffect(() => {
    if (open) {
      setFormData({
        title: '',
        category_id: '',
        monthly_amount: '',
        tenor_months: '',
        start_date: toISODate(new Date()),
        note: '',
      })
      setErrors({})
    }
  }, [open])

  // Cicilan selalu masuk pengeluaran, jadi hanya kategori expense.
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const monthly = Number(formData.monthly_amount) || 0
  const tenor = Number(formData.tenor_months) || 0
  const total = monthly * tenor

  const validate = () => {
    const e = {}
    if (!formData.title.trim()) e.title = 'Judul cicilan harus diisi'
    if (!formData.category_id) e.category_id = 'Pilih kategori'
    if (!formData.monthly_amount || monthly <= 0) e.monthly_amount = 'Nominal per bulan harus lebih dari 0'
    if (!formData.tenor_months || tenor <= 0) e.tenor_months = 'Tenor harus lebih dari 0'
    if (!formData.start_date) e.start_date = 'Pilih tanggal mulai'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      await dispatch(
        createInstallment({
          title: formData.title.trim(),
          category_id: formData.category_id,
          monthly_amount: monthly,
          tenor_months: tenor,
          start_date: formData.start_date,
          note: formData.note,
        })
      ).unwrap()
      onClose(true)
    } catch (err) {
      setErrors({ submit: err || 'Gagal menyimpan cicilan' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => !submitting && onClose(false)} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-text">Tambah Cicilan</h2>
          <button
            onClick={() => onClose(false)}
            disabled={submitting}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.submit && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-expense">
              {errors.submit}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">Judul (buat apa)</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="mis. Cicilan Motor"
              className={cn(
                'w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                errors.title ? 'border-expense' : 'border-gray-300'
              )}
            />
            {errors.title && <p className="mt-1 text-xs text-expense">{errors.title}</p>}
          </div>

          {/* Category (expense) */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">Kategori Pengeluaran</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                errors.category_id ? 'border-expense' : 'border-gray-300'
              )}
            >
              <option value="">Pilih kategori</option>
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="mt-1 text-xs text-expense">{errors.category_id}</p>}
          </div>

          {/* Monthly + Tenor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Per Bulan (Rp)</label>
              <input
                type="number"
                value={formData.monthly_amount}
                onChange={(e) => setFormData({ ...formData, monthly_amount: e.target.value })}
                placeholder="0"
                min="0"
                className={cn(
                  'w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                  errors.monthly_amount ? 'border-expense' : 'border-gray-300'
                )}
              />
              {errors.monthly_amount && <p className="mt-1 text-xs text-expense">{errors.monthly_amount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1">Tenor (bulan)</label>
              <input
                type="number"
                value={formData.tenor_months}
                onChange={(e) => setFormData({ ...formData, tenor_months: e.target.value })}
                placeholder="0"
                min="1"
                className={cn(
                  'w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                  errors.tenor_months ? 'border-expense' : 'border-gray-300'
                )}
              />
              {errors.tenor_months && <p className="mt-1 text-xs text-expense">{errors.tenor_months}</p>}
            </div>
          </div>

          {/* Total (dihitung) */}
          {total > 0 && (
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm flex items-center justify-between">
              <span className="text-gray-500">Total cicilan</span>
              <span className="font-semibold text-text">{formatIDR(total)}</span>
            </div>
          )}

          {/* Start date */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">Mulai (jatuh tempo pertama)</label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                errors.start_date ? 'border-expense' : 'border-gray-300'
              )}
            />
            {errors.start_date && <p className="mt-1 text-xs text-expense">{errors.start_date}</p>}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">Catatan (opsional)</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Tambahkan catatan..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              disabled={submitting}
              className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
