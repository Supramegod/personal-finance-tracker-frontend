import { useAppSelector } from '@/store/hooks'
import { formatIDR, formatDate, cn } from '@/lib/utils'

export default function DayTransactionPopup({ date, onClose, onRetry }) {
  const { transactions, transactionsStatus, transactionsError } = useAppSelector(
    (state) => state.calendar
  )

  const formattedDate = formatDate(date, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Hitung total income & expense
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  // Extract jam dari created_at
  function getTime(createdAt) {
    if (!createdAt) return ''
    const d = new Date(createdAt)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-base font-semibold text-text">{formattedDate}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Tutup"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Loading */}
          {transactionsStatus === 'loading' && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton w-3 h-3 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3 w-24" />
                    <div className="skeleton h-3 w-16" />
                  </div>
                  <div className="skeleton h-3 w-20" />
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {transactionsStatus === 'failed' && (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-expense" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-sm font-medium text-text">Gagal memuat transaksi</p>
              <p className="text-xs text-gray-400 mt-1">{transactionsError}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-3 py-1.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Coba lagi
                </button>
              )}
            </div>
          )}

          {/* Empty state */}
          {transactionsStatus === 'succeeded' && transactions.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">Tidak ada transaksi pada tanggal ini</p>
            </div>
          )}

          {/* Transaction list */}
          {transactionsStatus === 'succeeded' && transactions.length > 0 && (
            <>
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg transition-colors',
                      tx.type === 'income'
                        ? 'bg-income-light/40 hover:bg-income-light'
                        : 'bg-expense-light/40 hover:bg-expense-light'
                    )}
                  >
                    {/* Icon */}
                    <span className="text-lg shrink-0">
                      {tx.type === 'income' ? '🟢' : '🔴'}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {tx.category_name}
                      </p>
                      {tx.note && (
                        <p className="text-xs text-gray-400 truncate">{tx.note}</p>
                      )}
                    </div>

                    {/* Amount & Time */}
                    <div className="text-right shrink-0">
                      <p className={cn(
                        'text-sm font-semibold',
                        tx.type === 'income' ? 'text-income' : 'text-expense'
                      )}>
                        {tx.type === 'income' ? '+' : '-'}
                        {formatIDR(tx.amount)}
                      </p>
                      <p className="text-xs text-gray-400">{getTime(tx.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="my-4 border-t border-gray-100" />

              {/* Summary footer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Pemasukan</span>
                  <span className="font-semibold text-income">
                    {formatIDR(totalIncome)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Pengeluaran</span>
                  <span className="font-semibold text-expense">
                    {formatIDR(totalExpense)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
