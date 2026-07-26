import { formatIDR, formatDate, cn } from '@/lib/utils'

// Tambah n bulan ke sebuah tanggal (menangani pergantian tahun otomatis).
function addMonths(date, n) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

export default function InstallmentCard({ installment, onPay, onDelete, paying }) {
  const {
    title,
    category_name,
    monthly_amount,
    tenor_months,
    paid_count,
    total_amount,
    paid,
    start_date,
  } = installment

  const remaining = Math.max(tenor_months - paid_count, 0)
  const progress = tenor_months > 0 ? Math.min((paid_count / tenor_months) * 100, 100) : 0
  const remainingAmount = monthly_amount * remaining

  // start_date = jatuh tempo bulan ke-1. Bulan ke-N jatuh tempo di
  // start_date + (N-1) bulan. Jadi:
  //  - Selesai (bulan terakhir) = start_date + (tenor-1) bulan.
  //  - Jatuh tempo berikutnya (bulan belum dibayar pertama, indeks paid_count+1)
  //    = start_date + paid_count bulan. Null bila sudah lunas.
  const start = start_date ? new Date(start_date) : null
  const endDate = start && tenor_months > 0 ? addMonths(start, tenor_months - 1) : null
  const nextDueDate = start && !paid ? addMonths(start, paid_count) : null
  const dateOpts = { month: 'short', year: 'numeric' }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-text truncate">{title}</h3>
          <p className="text-xs text-gray-400 truncate">{category_name}</p>
        </div>
        <span
          className={cn(
            'shrink-0 px-2 py-0.5 rounded-full text-xs font-medium',
            paid ? 'bg-income-light text-income-dark' : 'bg-primary-light text-primary'
          )}
        >
          {paid ? 'Lunas' : 'Aktif'}
        </span>
      </div>

      {/* Amounts */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-xs text-gray-400">Per bulan</p>
          <p className="text-lg font-bold text-text">{formatIDR(monthly_amount)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-sm font-medium text-gray-600">{formatIDR(total_amount)}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{paid_count}/{tenor_months} bulan</span>
          <span>{remaining > 0 ? `Sisa ${formatIDR(remainingAmount)}` : 'Selesai'}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', paid ? 'bg-income' : 'bg-primary')}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Masa cicilan: jatuh tempo berikutnya + tanggal selesai */}
      {(nextDueDate || endDate) && (
        <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-gray-400">Jatuh tempo berikutnya</p>
            <p className="font-medium text-text">
              {nextDueDate ? formatDate(nextDueDate, dateOpts) : 'Lunas'}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-right">
            <p className="text-gray-400">Selesai</p>
            <p className="font-medium text-text">
              {endDate ? formatDate(endDate, dateOpts) : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onPay(installment)}
          disabled={paid || paying}
          className={cn(
            'flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors',
            paid
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary/90 disabled:opacity-50'
          )}
        >
          {paid ? 'Sudah lunas' : paying ? 'Memproses...' : 'Bayar bulan ini'}
        </button>
        <button
          onClick={() => onDelete(installment)}
          className="py-2 px-3 rounded-lg border border-gray-300 text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-expense hover:border-red-200 transition-colors"
          aria-label="Hapus cicilan"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
