import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchSavings, deleteSavings } from '@/store/slices/savingsSlice'
import { fetchBalance } from '@/store/slices/balanceSlice'
import SavingsCard from '@/components/shared/SavingsCard'
import SavingsForm from '@/components/shared/SavingsForm'
import SavingsEntryDialog from '@/components/shared/SavingsEntryDialog'
import SavingsDetailDialog from '@/components/shared/SavingsDetailDialog'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { formatIDR } from '@/lib/utils'

// 3 detik terlalu singkat untuk dibaca (WCAG 2.2.1); 6 detik lebih manusiawi.
const TOAST_DURATION_MS = 6000

const STATUS_FILTERS = [
  { value: '', label: 'Semua' },
  { value: 'active', label: 'Aktif' },
  { value: 'completed', label: 'Tercapai' },
  { value: 'archived', label: 'Diarsipkan' },
]

export default function SavingsPage() {
  const dispatch = useAppDispatch()
  const { items, status, error } = useAppSelector((state) => state.savings)
  const { balance, savingsTotal, netWorth } = useAppSelector((state) => state.balance)

  const [statusFilter, setStatusFilter] = useState('')
  const [formGoal, setFormGoal] = useState(null) // pot yang sedang diubah
  const [formOpen, setFormOpen] = useState(false)
  const [entryDialog, setEntryDialog] = useState(null) // { mode, goal }
  const [detailGoalId, setDetailGoalId] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [toast, setToast] = useState(null) // { type, message }

  // Saldo kas tidak berubah karena penyaringan — dipisah supaya tiap klik
  // filter tidak menembak /summary/balance dan memicu skeleton BalanceCard.
  useEffect(() => {
    dispatch(fetchBalance())
  }, [dispatch])

  useEffect(() => {
    // Di-abort saat filter berganti: tanpa itu respons filter lama bisa
    // mendarat terakhir dan daftar tidak cocok dengan tombol yang aktif.
    const request = dispatch(fetchSavings(statusFilter ? { status: statusFilter } : {}))
    return () => request.abort()
  }, [dispatch, statusFilter])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast])

  // Setoran & penarikan menggerakkan saldo kas, jadi saldo ikut di-refetch.
  const reload = () =>
    Promise.all([
      dispatch(fetchSavings(statusFilter ? { status: statusFilter } : {})),
      dispatch(fetchBalance()),
    ])

  const isLoading = status === 'loading'
  const totalTarget = items.reduce((sum, goal) => sum + (goal.target_amount ?? 0), 0)

  const handleOpenCreate = () => {
    setFormGoal(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (goal) => {
    setFormGoal(goal)
    setFormOpen(true)
  }

  const handleFormClose = (success) => {
    setFormOpen(false)
    if (!success) return
    reload()
    setToast({ type: 'success', message: formGoal ? 'Tabungan diperbarui' : 'Tabungan ditambahkan' })
  }

  const handleEntryClose = (success) => {
    const wasWithdraw = entryDialog?.mode === 'withdraw'
    setEntryDialog(null)
    if (!success) return
    reload()
    setToast({
      type: 'success',
      message: wasWithdraw ? 'Penarikan tercatat' : 'Setoran tercatat',
    })
  }

  const handleDetailClose = (changed) => {
    setDetailGoalId(null)
    if (!changed) return
    reload()
    setToast({ type: 'success', message: 'Mutasi dibatalkan' })
  }

  const handleDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await dispatch(deleteSavings(deleting.id)).unwrap()
      await reload()
      setToast({ type: 'success', message: 'Tabungan dihapus' })
      setDeleting(null)
    } catch (err) {
      setToast({ type: 'error', message: err || 'Gagal menghapus tabungan' })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <span>Dashboard</span>
            <span>/</span>
            <span className="font-medium text-primary">Tabungan</span>
          </div>
          <h1 className="text-2xl font-bold text-text">Tabungan</h1>
        </div>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Tabungan
        </button>
      </div>

      {/* Ringkasan */}
      <section
        aria-labelledby="savings-summary-heading"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <h2 id="savings-summary-heading" className="sr-only">
          Ringkasan tabungan
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total tabungan</p>
          <p className="text-2xl font-bold text-income-dark">{formatIDR(savingsTotal)}</p>
          <p className="mt-1 text-xs text-gray-500">{items.length} pot</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Saldo kas</p>
          <p className="text-2xl font-bold text-text">{formatIDR(balance)}</p>
          <p className="mt-1 text-xs text-gray-500">Bebas dipakai</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Kekayaan bersih</p>
          <p className="text-2xl font-bold text-primary">{formatIDR(netWorth)}</p>
          <p className="mt-1 text-xs text-gray-500">
            {totalTarget > 0 ? `Total target ${formatIDR(totalTarget)}` : 'Kas + tabungan'}
          </p>
        </div>
      </section>

      {/* Filter status */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Saring berdasarkan status">
        {STATUS_FILTERS.map((filter) => {
          const isActive = statusFilter === filter.value
          return (
            <button
              key={filter.value || 'all'}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              aria-pressed={isActive}
              className={
                isActive
                  ? 'rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white'
                  : 'rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50'
              }
            >
              {filter.label}
            </button>
          )
        })}
      </div>

      {status === 'failed' && (
        <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-expense-dark">
          {error || 'Gagal memuat tabungan'}
        </div>
      )}

      {/* Daftar pot */}
      {isLoading && items.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2" aria-busy="true">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="skeleton mb-3 h-5 w-40" />
              <div className="skeleton mb-3 h-8 w-32" />
              <div className="skeleton mb-3 h-2 w-full" />
              <div className="skeleton h-9 w-full" />
            </div>
          ))}
        </div>
      ) : status === 'failed' ? null : items.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <svg
            className="mx-auto mb-3 h-12 w-12 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mb-4 text-sm text-gray-500">
            {statusFilter
              ? 'Tidak ada tabungan dengan status ini.'
              : 'Belum ada tabungan. Mulai sisihkan uang untuk tujuan tertentu.'}
          </p>
          {!statusFilter && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Tambah Tabungan
            </button>
          )}
        </div>
      ) : (
        <ul className="grid list-none grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((goal) => (
            <li key={goal.id}>
            <SavingsCard
              key={goal.id}
              goal={goal}
              onDeposit={(g) => setEntryDialog({ mode: 'deposit', goal: g })}
              onWithdraw={(g) => setEntryDialog({ mode: 'withdraw', goal: g })}
              onOpenDetail={(g) => setDetailGoalId(g.id)}
              onEdit={handleOpenEdit}
              onDelete={setDeleting}
            />
            </li>
          ))}
        </ul>
      )}

      {/* Toast — role=status supaya perubahan diumumkan pembaca layar */}
      {/* Dua live region terpisah: kegagalan harus assertive, keberhasilan
          cukup polite. Politeness sebuah region tidak boleh berubah dinamis. */}
      <div aria-live="polite" role="status" className="sr-only">
        {toast?.type === 'success' ? toast.message : ''}
      </div>
      <div aria-live="assertive" role="alert" className="sr-only">
        {toast?.type === 'error' ? toast.message : ''}
      </div>
      {toast && (
        // aria-hidden: teksnya sudah diumumkan lewat live region di atas —
        // tanpa ini pembaca layar mendengarnya dua kali.
        <div
          aria-hidden="true"
          className={`fixed bottom-6 right-6 z-50 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === 'success'
              ? 'border-income bg-income-light text-income-dark'
              : 'border-expense bg-expense-light text-expense-dark'
          }`}
        >
          {toast.message}
        </div>
      )}

      <SavingsForm open={formOpen} goal={formGoal} onClose={handleFormClose} />

      <SavingsEntryDialog
        open={Boolean(entryDialog)}
        mode={entryDialog?.mode ?? 'deposit'}
        goal={entryDialog?.goal ?? null}
        cashBalance={balance}
        onClose={handleEntryClose}
      />

      <SavingsDetailDialog
        open={Boolean(detailGoalId)}
        goalId={detailGoalId}
        onClose={handleDetailClose}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Hapus Tabungan"
        message={`Hapus tabungan "${deleting?.name}"? Saldonya harus kosong dulu — tarik seluruh isinya sebelum menghapus.`}
        isLoading={deleteLoading}
      />
    </div>
  )
}
