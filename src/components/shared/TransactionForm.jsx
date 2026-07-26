import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchCategories } from '@/store/slices/categorySlice'
import { createTransaction, updateTransaction } from '@/store/slices/transactionSlice'
import { toISODate, cn } from '@/lib/utils'

export default function TransactionForm({ open, onClose, transaction }) {
  const dispatch = useAppDispatch()
  const { items: categories } = useAppSelector((state) => state.categories)

  const isEdit = !!transaction
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category_id: '',
    transaction_date: toISODate(new Date()),
    note: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        amount: String(transaction.amount),
        category_id: transaction.category_id,
        // Backend mengirim transaction_date format RFC3339
        // (2026-06-20T00:00:00Z); <input type="date"> butuh YYYY-MM-DD,
        // jadi dinormalkan dulu agar tidak tampil kosong saat edit.
        transaction_date: toISODate(transaction.transaction_date),
        note: transaction.note || '',
      })
    } else {
      setFormData({
        type: 'expense',
        amount: '',
        category_id: '',
        transaction_date: toISODate(new Date()),
        note: '',
      })
    }
    setErrors({})
  }, [transaction, open])

  const filteredCategories = categories.filter((c) => c.type === formData.type)

  const validate = () => {
    const newErrors = {}
    const amountNum = Number(formData.amount)

    if (!formData.amount || amountNum <= 0) {
      newErrors.amount = 'Jumlah harus lebih dari 0'
    }
    if (!formData.category_id) {
      newErrors.category_id = 'Pilih kategori'
    }
    if (!formData.transaction_date) {
      newErrors.transaction_date = 'Pilih tanggal'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const data = {
        type: formData.type,
        amount: Number(formData.amount),
        category_id: formData.category_id,
        transaction_date: formData.transaction_date,
        note: formData.note,
      }

      if (isEdit) {
        await dispatch(updateTransaction({ id: transaction.id, data })).unwrap()
      } else {
        await dispatch(createTransaction(data)).unwrap()
      }
      onClose(true) // true = success
    } catch (err) {
      setErrors({ submit: err || 'Gagal menyimpan transaksi' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => !submitting && onClose(false)}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-text">
            {isEdit ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </h2>
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
          {/* Submit error */}
          {errors.submit && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-expense">
              {errors.submit}
            </div>
          )}

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">Tipe Transaksi</label>
            <div className="flex gap-3">
              <label
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                  formData.type === 'income'
                    ? 'border-income bg-income-light text-income-dark'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) => {
                    setFormData({ ...formData, type: e.target.value, category_id: '' })
                  }}
                  className="sr-only"
                />
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                Pemasukan
              </label>
              <label
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-colors',
                  formData.type === 'expense'
                    ? 'border-expense bg-expense-light text-expense-dark'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) => {
                    setFormData({ ...formData, type: e.target.value, category_id: '' })
                  }}
                  className="sr-only"
                />
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                Pengeluaran
              </label>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">Jumlah (Rp)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0"
              min="0"
              className={cn(
                'w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                errors.amount ? 'border-expense' : 'border-gray-300'
              )}
            />
            {errors.amount && <p className="mt-1 text-xs text-expense">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">Kategori</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                errors.category_id ? 'border-expense' : 'border-gray-300'
              )}
            >
              <option value="">Pilih kategori</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="mt-1 text-xs text-expense">{errors.category_id}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">Tanggal</label>
            <input
              type="date"
              value={formData.transaction_date}
              onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                errors.transaction_date ? 'border-expense' : 'border-gray-300'
              )}
            />
            {errors.transaction_date && <p className="mt-1 text-xs text-expense">{errors.transaction_date}</p>}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-text mb-1">Catatan (opsional)</label>
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Tambahkan catatan..."
              rows={3}
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
              className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
