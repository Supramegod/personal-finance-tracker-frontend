import { useEffect, useState, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchTransactions,
  deleteTransaction,
  setPage,
} from '@/store/slices/transactionSlice'
import { fetchBalance } from '@/store/slices/balanceSlice'
import TransactionFilter from '@/components/shared/TransactionFilter'
import TransactionTable from '@/components/shared/TransactionTable'
import TransactionForm from '@/components/shared/TransactionForm'
import ConfirmDialog from '@/components/shared/ConfirmDialog'

export default function TransactionPage() {
  const dispatch = useAppDispatch()
  const { items, total, page, limit, status, error, filters } = useAppSelector(
    (state) => state.transactions
  )

  const [formOpen, setFormOpen] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const [deletingTx, setDeletingTx] = useState(null)
  const [toast, setToast] = useState(null) // { type: 'success'|'error', message }
  const [deleteLoading, setDeleteLoading] = useState(false)

  const isLoading = status === 'loading'

  const loadTransactions = useCallback(() => {
    const params = {
      page,
      limit,
      type: filters.type !== 'all' ? filters.type : undefined,
      category_id: filters.category_id || undefined,
      from: filters.from || undefined,
      to: filters.to || undefined,
      search: filters.search || undefined,
    }
    dispatch(fetchTransactions(params))
  }, [dispatch, page, limit, filters])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const handleSearch = () => {
    dispatch(setPage(1))
    loadTransactions()
  }

  const handlePageChange = (newPage) => {
    dispatch(setPage(newPage))
  }

  const handleAdd = () => {
    setEditingTx(null)
    setFormOpen(true)
  }

  const handleEdit = (tx) => {
    setEditingTx(tx)
    setFormOpen(true)
  }

  const handleFormClose = (success) => {
    setFormOpen(false)
    setEditingTx(null)
    if (success) {
      setToast({ type: 'success', message: editingTx ? 'Transaksi berhasil diupdate' : 'Transaksi berhasil ditambahkan' })
      loadTransactions()
      dispatch(fetchBalance())
    }
  }

  const handleDeleteClick = (tx) => {
    setDeletingTx(tx)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingTx) return
    setDeleteLoading(true)
    try {
      await dispatch(deleteTransaction(deletingTx.id)).unwrap()
      setToast({ type: 'success', message: 'Transaksi berhasil dihapus' })
      setDeletingTx(null)
      loadTransactions()
      dispatch(fetchBalance())
    } catch (err) {
      setToast({ type: 'error', message: err || 'Gagal menghapus transaksi' })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-primary font-medium">Transaksi</span>
          </div>
          <h1 className="text-2xl font-bold text-text">Transaksi</h1>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Baru
        </button>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-income-light text-income-dark border border-income/20'
              : 'bg-expense-light text-expense-dark border border-expense/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {toast.message}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-expense flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
          <button
            onClick={loadTransactions}
            className="text-expense font-medium hover:underline"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Filter */}
      <TransactionFilter onSearch={handleSearch} />

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        <TransactionTable
          transactions={items}
          total={total}
          page={page}
          limit={limit}
          isLoading={isLoading && items.length === 0}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Form Modal */}
      <TransactionForm
        open={formOpen}
        onClose={handleFormClose}
        transaction={editingTx}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingTx}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleDeleteConfirm}
        title="Hapus Transaksi?"
        message={
          deletingTx
            ? `Transaksi "${deletingTx.category_name} - Rp ${deletingTx.amount.toLocaleString(
                'id-ID'
              )}" akan dihapus. Tindakan ini tidak bisa dibatalkan.`
            : ''
        }
        confirmLabel="Ya, Hapus"
        isLoading={deleteLoading}
      />
    </div>
  )
}
