import { formatIDR, formatDate, cn } from '@/lib/utils'

const STATUS_LABEL = {
  active: 'Aktif',
  completed: 'Tercapai',
  archived: 'Diarsipkan',
}

const STATUS_STYLE = {
  active: 'bg-primary-light text-primary',
  completed: 'bg-income-light text-income-dark',
  archived: 'bg-gray-100 text-gray-600',
}

export default function SavingsCard({ goal, onDeposit, onWithdraw, onEdit, onDelete, onOpenDetail }) {
  const {
    name,
    status,
    target_amount,
    target_date,
    saved_amount,
    progress,
    remaining_amount,
    months_left,
    suggested_monthly,
    is_on_track,
  } = goal

  // Pot tanpa target (mis. dana darurat) tidak punya progres — backend
  // mengirim null, bukan 0, supaya bisa dibedakan dari "target belum tersentuh".
  const hasTarget = target_amount != null && target_amount > 0
  // Diklem: kalau tabungan melampaui target, aria-valuenow tidak boleh
  // melebihi aria-valuemax — nilai di luar rentang bikin perilaku AT tak
  // terdefinisi. Angka aslinya tetap tersampaikan lewat aria-valuetext.
  const percent = hasTarget ? Math.min(Math.round((progress ?? 0) * 100), 100) : 0
  const canWithdraw = saved_amount > 0

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-text">{name}</h3>
          <p className="text-xs text-gray-500">
            {hasTarget ? `Target ${formatIDR(target_amount)}` : 'Tanpa target'}
            {target_date && ` · ${formatDate(target_date, { month: 'short', year: 'numeric' })}`}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
            STATUS_STYLE[status] || STATUS_STYLE.active
          )}
        >
          {STATUS_LABEL[status] || status}
        </span>
      </div>

      {/* Terkumpul */}
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-500">Terkumpul</p>
          <p className="text-lg font-bold text-income-dark">{formatIDR(saved_amount)}</p>
        </div>
        {hasTarget && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Kurang</p>
            <p className="text-sm font-medium text-gray-600">{formatIDR(remaining_amount ?? 0)}</p>
          </div>
        )}
      </div>

      {/* Progress */}
      {hasTarget && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>{percent}% tercapai</span>
            {months_left != null && (
              <span>{months_left > 0 ? `${months_left} bulan lagi` : 'Jatuh tempo'}</span>
            )}
          </div>
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${formatIDR(saved_amount)} dari ${formatIDR(target_amount)}`}
            aria-label={`Progres tabungan ${name}`}
            className="h-2 w-full overflow-hidden rounded-full bg-gray-200 ring-1 ring-gray-300"
          >
            <div
              className={cn(
                'h-full rounded-full transition-all',
                status === 'completed' ? 'bg-income-dark' : 'bg-primary'
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Saran setoran bulanan — ini yang mengubah pencatatan jadi perencanaan */}
      {hasTarget && suggested_monthly != null && status !== 'completed' && (
        <div
          className={cn(
            'mb-3 rounded-lg px-3 py-2 text-xs',
            is_on_track === false ? 'bg-expense-light/40' : 'bg-gray-50'
          )}
        >
          <p className="text-gray-600">
            Sisihkan{' '}
            <span className="font-semibold text-text">{formatIDR(suggested_monthly)}</span>
            /bulan untuk mengejar target
          </p>
          {is_on_track != null && (
            <p className={cn('mt-0.5 font-medium', is_on_track ? 'text-income-dark' : 'text-expense-dark')}>
              {is_on_track ? '✓ Sesuai jadwal' : '! Tertinggal dari jadwal'}
            </p>
          )}
        </div>
      )}

      {/* Aksi */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onDeposit(goal)}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          Setor
        </button>
        <button
          type="button"
          onClick={() => onWithdraw(goal)}
          disabled={!canWithdraw}
          className={cn(
            'flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
            canWithdraw
              ? 'border-gray-300 text-gray-700 hover:bg-gray-50'
              : 'cursor-not-allowed border-gray-200 text-gray-300'
          )}
        >
          Tarik
        </button>
        <button
          type="button"
          onClick={() => onOpenDetail(goal)}
          aria-label={`Lihat riwayat mutasi ${name}`}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onEdit(goal)}
          aria-label={`Ubah tabungan ${name}`}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onDelete(goal)}
          aria-label={`Hapus tabungan ${name}`}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-expense"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
