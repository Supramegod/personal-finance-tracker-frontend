import { useEffect, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchReport } from '@/store/slices/balanceSlice'
import AIInsightPanel from '@/components/shared/AIInsightPanel'
import IncomeExpenseChart from '@/components/shared/IncomeExpenseChart'
import { cn, formatIDR, toISODate, toISOMonth } from '@/lib/utils'

function previousMonth() {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() - 1)
  return toISOMonth(date)
}

function defaultRange() {
  const now = new Date()
  return {
    from: `${now.getFullYear()}-01-01`,
    to: toISODate(now),
  }
}

export default function ReportsPage() {
  const dispatch = useAppDispatch()
  const { report, reportStatus, error } = useAppSelector((state) => state.balance)
  const initialRange = useMemo(defaultRange, [])
  const [period, setPeriod] = useState('monthly')
  const [from, setFrom] = useState(initialRange.from)
  const [to, setTo] = useState(initialRange.to)
  const [insightMonth, setInsightMonth] = useState(previousMonth)

  useEffect(() => {
    if (!from || !to || from > to) return
    dispatch(fetchReport({ period, from, to }))
  }, [dispatch, from, period, to])

  const loading = reportStatus === 'loading'
  const invalidRange = from > to

  return (
    <div className="space-y-6">
      <header>
        <div className="mb-1 flex items-center gap-2 text-sm text-gray-400">
          <span>Dashboard</span><span>/</span><span className="font-medium text-primary">Laporan</span>
        </div>
        <h1 className="text-2xl font-bold text-text">Laporan Keuangan</h1>
        <p className="mt-1 text-sm text-gray-500">Pantau angka aktual dan dapatkan analisis bulanan yang lebih mudah dipahami.</p>
      </header>

      <AIInsightPanel month={insightMonth} onMonthChange={setInsightMonth} />

      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-semibold text-text">Ringkasan angka</h2>
            <p className="mt-1 text-sm text-gray-500">Data ini dihitung langsung dari transaksi kelompok.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs font-medium text-gray-500">Dari
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1 block min-h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-text outline-none focus:border-primary" />
            </label>
            <label className="text-xs font-medium text-gray-500">Sampai
              <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1 block min-h-10 w-full rounded-lg border border-gray-200 px-3 text-sm text-text outline-none focus:border-primary" />
            </label>
            <label className="text-xs font-medium text-gray-500">Kelompok data
              <select value={period} onChange={(event) => setPeriod(event.target.value)} className="mt-1 block min-h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-text outline-none focus:border-primary">
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
              </select>
            </label>
          </div>
        </div>
        {invalidRange && <p className="mt-3 text-sm text-expense">Tanggal awal tidak boleh melewati tanggal akhir.</p>}
      </section>

      {reportStatus === 'failed' ? (
        <section className="rounded-xl border border-expense/20 bg-expense-light/30 p-6 text-center">
          <p className="font-semibold text-expense">Laporan gagal dimuat</p>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button onClick={() => dispatch(fetchReport({ period, from, to }))} className="mt-4 text-sm font-semibold text-primary">Coba lagi</button>
        </section>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Total pemasukan" value={report.total_income} tone="income" loading={loading} />
            <MetricCard label="Total pengeluaran" value={report.total_expense} tone="expense" loading={loading} />
            <MetricCard label="Saldo bersih" value={report.net} tone={report.net >= 0 ? 'income' : 'expense'} loading={loading} />
          </div>
          <IncomeExpenseChart data={report.periods} isLoading={loading} />
        </>
      )}
    </div>
  )
}

function MetricCard({ label, value, tone, loading }) {
  if (loading) return <div className="skeleton h-28 rounded-xl" />
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={cn('mt-2 text-xl font-bold', tone === 'income' ? 'text-income' : 'text-expense')}>{formatIDR(value || 0)}</p>
    </div>
  )
}
