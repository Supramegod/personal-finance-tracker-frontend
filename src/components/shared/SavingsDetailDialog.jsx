import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchSavingsDetail, deleteSavingsEntry, clearSavingsDetail } from '@/store/slices/savingsSlice'
import { formatIDR, formatDate, cn } from '@/lib/utils'
import Modal from '@/components/shared/Modal'

/**
 * Riwayat mutasi satu pot tabungan, dengan aksi membatalkan mutasi.
 *
 * Membatalkan di sini adalah SATU-SATUNYA cara yang benar: transaksi yang
 * tercipta bersama mutasi ikut dihapus dalam satu transaksi DB. Menghapusnya
 * lewat halaman Transaksi ditolak backend.
 *
 * @param {{ open: boolean, goalId: string|null, onClose: (changed: boolean) => void }} props
 */
export default function SavingsDetailDialog({ open, goalId, onClose }) {
  const dispatch = useAppDispatch()
  const { detail, detailStatus, error } = useAppSelector((state) => state.savings)

  const [cancelingId, setCancelingId] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  // Kalau ada mutasi yang dibatalkan, induk harus me-refetch daftar & saldo.
  const [changed, setChanged] = useState(false)

  useEffect(() => {
    if (!open || !goalId) return
    setErrorMessage('')
    setChanged(false)
    // Promise thunk-nya di-abort saat cleanup. Tanpa itu, fulfilled yang
    // datang telat menulis ulang `detail` SETELAH clearSavingsDetail — buka
    // pot A lalu cepat pindah ke pot B bisa menampilkan riwayat pot A.
    const request = dispatch(fetchSavingsDetail(goalId))
    return () => {
      request.abort()
      dispatch(clearSavingsDetail())
    }
  }, [open, goalId, dispatch])

  const handleCancelEntry = async (entry) => {
    setCancelingId(entry.id)
    setErrorMessage('')
    try {
      await dispatch(deleteSavingsEntry({ id: goalId, entryId: entry.id })).unwrap()
      setChanged(true)
      await dispatch(fetchSavingsDetail(goalId))
    } catch (err) {
      setErrorMessage(err || 'Gagal membatalkan mutasi')
    } finally {
      setCancelingId(null)
    }
  }

  const entries = detail?.entries ?? []
  const isLoading = detailStatus === 'loading'

  return (
    <Modal
      open={open}
      onClose={() => onClose(changed)}
      busy={Boolean(cancelingId)}
      title={detail?.goal?.name ? `Riwayat — ${detail.goal.name}` : 'Riwayat Mutasi'}
    >
      <div className="space-y-3 p-6">
        {errorMessage && (
          <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-expense-dark">
            {errorMessage}
          </div>
        )}

        {detail?.goal && (
          <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <span className="text-gray-500">Saldo sekarang</span>
            <span className="font-semibold text-income-dark">
              {formatIDR(detail.goal.saved_amount)}
            </span>
          </div>
        )}

        {detailStatus === 'failed' ? (
          // Tanpa cabang ini, gagal-muat terlihat identik dengan pot kosong.
          <p role="alert" className="py-6 text-center text-sm text-expense-dark">
            {error || 'Gagal memuat riwayat mutasi'}
          </p>
        ) : isLoading && entries.length === 0 ? (
          <div className="space-y-2" aria-live="polite" aria-busy="true">
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        ) : entries.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            Belum ada setoran maupun penarikan.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {entries.map((entry) => {
              const isDeposit = entry.direction === 'deposit'
              return (
                <li key={entry.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">
                      {entry.note || (isDeposit ? 'Setoran' : 'Penarikan')}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(entry.entry_date)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isDeposit ? 'text-income-dark' : 'text-expense-dark'
                      )}
                    >
                      {isDeposit ? '+' : '−'}
                      {formatIDR(entry.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCancelEntry(entry)}
                      disabled={Boolean(cancelingId)}
                      aria-label={`Batalkan ${isDeposit ? 'setoran' : 'penarikan'} ${formatIDR(entry.amount)} tanggal ${formatDate(entry.entry_date)}`}
                      className="rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-expense disabled:opacity-50"
                    >
                      {cancelingId === entry.id ? '...' : 'Batalkan'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <p className="text-xs text-gray-500">
          Membatalkan mutasi juga menghapus transaksi yang tercipta bersamanya.
        </p>

        <button
          type="button"
          onClick={() => onClose(changed)}
          disabled={Boolean(cancelingId)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          Tutup
        </button>
      </div>
    </Modal>
  )
}
