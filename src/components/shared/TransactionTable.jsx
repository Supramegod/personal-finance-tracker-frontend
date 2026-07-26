import { formatIDR, formatDate, cn } from '@/lib/utils'

export default function TransactionTable({
  transactions,
  total,
  page,
  limit,
  isLoading,
  onEdit,
  onDelete,
  onPageChange,
}) {
  const totalPages = Math.ceil(total / limit)

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="skeleton h-10 w-full" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-14 w-full" />
        ))}
      </div>
    )
  }

  // Empty state
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 className="text-base font-medium text-gray-600 mb-1">Belum ada transaksi</h3>
        <p className="text-sm text-gray-400 mb-4">
          Mulai catat pengeluaran atau pemasukan Anda
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="text-left py-3.5 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Tanggal</th>
              <th className="text-left py-3.5 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Kategori</th>
              <th className="text-left py-3.5 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Tipe</th>
              <th className="text-right py-3.5 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Jumlah</th>
              <th className="text-left py-3.5 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Catatan</th>
              <th className="text-center py-3.5 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
              >
                <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                  {formatDate(tx.transaction_date)}
                </td>
                <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                  {tx.category_name}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      tx.type === 'income'
                        ? 'bg-income-light text-income-dark'
                        : 'bg-expense-light text-expense-dark'
                    )}
                  >
                    {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                </td>
                <td
                  className={cn(
                    'py-3.5 px-4 text-right font-semibold whitespace-nowrap',
                    tx.type === 'income' ? 'text-income' : 'text-expense'
                  )}
                >
                  {tx.type === 'income' ? '+' : '-'}{formatIDR(tx.amount)}
                </td>
                <td className="py-3.5 px-4 text-gray-500 max-w-[200px] truncate" title={tx.note}>
                  {tx.note || '-'}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEdit(tx)}
                      className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary-light transition-colors"
                      title="Edit transaksi"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(tx)}
                      className="p-2 rounded-lg text-gray-400 hover:text-expense hover:bg-expense-light transition-colors"
                      title="Hapus transaksi"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
          <p className="text-sm text-gray-500">
            Menampilkan {(page - 1) * limit + 1}-{Math.min(page * limit, total)} dari {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ‹
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-lg transition-colors',
                    page === pageNum
                      ? 'bg-primary text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {pageNum}
                </button>
              )
            })}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
