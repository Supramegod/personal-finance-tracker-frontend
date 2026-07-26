import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchBalance, fetchReport } from '@/store/slices/balanceSlice'
import { fetchTransactions } from '@/store/slices/transactionSlice'
import { fetchInstallments } from '@/store/slices/installmentSlice'
import BalanceCard from '@/components/shared/BalanceCard'
import SummaryCard from '@/components/shared/SummaryCard'
import IncomeExpenseChart from '@/components/shared/IncomeExpenseChart'
import CalendarView from '@/components/shared/CalendarView'
import { formatIDR, formatDate, cn } from '@/lib/utils'

// Tambah n bulan ke sebuah tanggal (menangani pergantian tahun otomatis).
function addMonths(date, n) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

export default function DashboardPage() {
  const dispatch = useAppDispatch()
  const { balance, report, status: balanceStatus } = useAppSelector((state) => state.balance)
  const { items: transactions, status: txStatus } = useAppSelector((state) => state.transactions)
  const { items: installments } = useAppSelector((state) => state.installments)
  const { user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    dispatch(fetchBalance())
    dispatch(fetchReport({ period: 'monthly', from: '2026-01-01', to: '2026-12-31' }))
    dispatch(fetchTransactions({ limit: 5, page: 1 }))
    dispatch(fetchInstallments())
  }, [dispatch])

  const isLoadingBalance = balanceStatus === 'loading'
  const isLoadingTx = txStatus === 'loading'
  const recentTransactions = transactions.slice(0, 5)

  // Ringkasan cicilan: total sisa tanggungan + jatuh tempo terdekat.
  const activeInstallments = installments.filter((i) => !i.paid)
  const totalRemainingInstallment = activeInstallments.reduce(
    (sum, i) => sum + i.monthly_amount * Math.max(i.tenor_months - i.paid_count, 0),
    0
  )
  // Jatuh tempo berikutnya per cicilan aktif = start_date + paid_count bulan.
  const upcomingDues = activeInstallments
    .filter((i) => i.start_date)
    .map((i) => ({
      id: i.id,
      title: i.title,
      amount: i.monthly_amount,
      dueDate: addMonths(new Date(i.start_date), i.paid_count),
    }))
    .sort((a, b) => a.dueDate - b.dueDate)
    .slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">
          Selamat datang, {user?.full_name || 'User'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Ringkasan keuangan Anda
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BalanceCard balance={balance} isLoading={isLoadingBalance} />
        <SummaryCard
          title="Total Pemasukan"
          amount={report.total_income}
          type="income"
          isLoading={balanceStatus === 'loading'}
        />
        <SummaryCard
          title="Total Pengeluaran"
          amount={report.total_expense}
          type="expense"
          isLoading={balanceStatus === 'loading'}
        />
      </div>

      {/* Calendar + Chart — 2 kolom di desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kalender */}
        <CalendarView />

        {/* Chart */}
        <IncomeExpenseChart
          data={report.periods}
          isLoading={balanceStatus === 'loading'}
        />
      </div>

      {/* Ringkasan Cicilan */}
      {installments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text">Cicilan</h3>
            <Link
              to="/installments"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Kelola →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total sisa tanggungan */}
            <div className="rounded-lg bg-expense-light/40 p-4">
              <p className="text-xs text-gray-500">Sisa tanggungan</p>
              <p className="text-xl font-bold text-expense">{formatIDR(totalRemainingInstallment)}</p>
              <p className="text-xs text-gray-400 mt-1">{activeInstallments.length} cicilan aktif</p>
            </div>

            {/* Jatuh tempo terdekat */}
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 mb-2">Jatuh tempo terdekat</p>
              {upcomingDues.length === 0 ? (
                <p className="text-sm text-gray-400">Semua cicilan lunas 🎉</p>
              ) : (
                <div className="space-y-2">
                  {upcomingDues.map((d) => (
                    <div key={d.id} className="flex items-center justify-between text-sm">
                      <div className="min-w-0">
                        <span className="font-medium text-text truncate">{d.title}</span>
                        <span className="ml-2 text-xs text-gray-400">
                          {formatDate(d.dueDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <span className="shrink-0 font-semibold text-expense">{formatIDR(d.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text">
            Transaksi Terakhir
          </h3>
          <Link
            to="/transactions"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Lihat Semua →
          </Link>
        </div>

        {isLoadingTx ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">Belum ada transaksi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Tanggal</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Tipe</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Kategori</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-500 text-xs uppercase tracking-wider">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-2 text-gray-600">{formatDate(tx.transaction_date)}</td>
                    <td className="py-3 px-2">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        tx.type === 'income'
                          ? 'bg-income-light text-income-dark'
                          : 'bg-expense-light text-expense-dark'
                      )}>
                        {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-600">{tx.category_name}</td>
                    <td className={cn(
                      'py-3 px-2 text-right font-semibold',
                      tx.type === 'income' ? 'text-income' : 'text-expense'
                    )}>
                      {tx.type === 'income' ? '+' : '-'}{formatIDR(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
