import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchInstallments,
  payInstallment,
  deleteInstallment,
} from '@/store/slices/installmentSlice'
import { fetchBalance } from '@/store/slices/balanceSlice'
import InstallmentForm from '@/components/shared/InstallmentForm'
import InstallmentCard from '@/components/shared/InstallmentCard'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { formatIDR } from '@/lib/utils'

export default function InstallmentPage() {
  const dispatch = useAppDispatch()
  const { items, status, error } = useAppSelector((state) => state.installments)

  const [formOpen, setFormOpen] = useState(false)
  const [payingId, setPayingId] = useState(null)
  const [deleting, setDeleting] = useState(null) // installment object
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState(null) // { type, message }

  useEffect(() => {
    dispatch(fetchInstallments())
  }, [dispatch])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  const isLoading = status === 'loading'

  // Ringkasan: total sisa tanggungan seluruh cicilan aktif.
  const totalRemaining = items.reduce(
    (sum, i) => sum + i.monthly_amount * Math.max(i.tenor_months - i.paid_count, 0),
    0
  )

  const handlePay = async (inst) => {
    setPayingId(inst.id)
    try {
      await dispatch(payInstallment(inst.id)).unwrap()
      // Refetch cicilan + saldo (pembayaran membuat transaksi expense).
      await Promise.all([dispatch(fetchInstallments()), dispatch(fetchBalance())])
      setToast({ type: 'success', message: `Cicilan "${inst.title}" bulan ini tercatat` })
    } catch (err) {
      setToast({ type: 'error', message: err || 'Gagal membayar cicilan' })
    } finally {
      setPayingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await dispatch(deleteInstallment(deleting.id)).unwrap()
      await dispatch(fetchInstallments())
      setToast({ type: 'success', message: 'Cicilan dihapus' })
      setDeleting(null)
    } catch (err) {
      setToast({ type: 'error', message: err || 'Gagal menghapus cicilan' })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormClose = (success) => {
    setFormOpen(false)
    if (success) {
      dispatch(fetchInstallments())
      setToast({ type: 'success', message: 'Cicilan ditambahkan' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-primary font-medium">Cicilan</span>
          </div>
          <h1 className="text-2xl font-bold text-text">Cicilan</h1>
        </div>
        <button
          onClick={() => setFormOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Cicilan
        </button>
      </div>

      {/* Ringkasan sisa tanggungan */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total sisa tanggungan</p>
            <p className="text-2xl font-bold text-expense">{formatIDR(totalRemaining)}</p>
          </div>
          <div className="text-right text-sm text-gray-400">
            {items.length} cicilan
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'failed' && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-expense">
          {error || 'Gagal memuat cicilan'}
        </div>
      )}

      {/* Loading */}
      {isLoading && items.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="skeleton h-5 w-40 mb-3" />
              <div className="skeleton h-8 w-32 mb-3" />
              <div className="skeleton h-2 w-full mb-3" />
              <div className="skeleton h-9 w-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m3 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H10a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-500 mb-4">Belum ada cicilan. Tambahkan cicilan pertama Anda.</p>
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Tambah Cicilan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((inst) => (
            <InstallmentCard
              key={inst.id}
              installment={inst}
              onPay={handlePay}
              onDelete={setDeleting}
              paying={payingId === inst.id}
            />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
            toast.type === 'success' ? 'bg-income' : 'bg-expense'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Form */}
      <InstallmentForm open={formOpen} onClose={handleFormClose} />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Hapus Cicilan"
        message={`Hapus cicilan "${deleting?.title}"? Transaksi pengeluaran yang sudah tercatat tetap ada.`}
        isLoading={deleteLoading}
      />
    </div>
  )
}
