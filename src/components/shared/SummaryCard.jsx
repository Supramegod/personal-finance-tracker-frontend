import { formatIDR } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function SummaryCard({ title, amount, type, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="skeleton h-4 w-20 mb-3" />
        <div className="skeleton h-7 w-32 mb-2" />
        <div className="skeleton h-3 w-16" />
      </div>
    )
  }

  const isIncome = type === 'income'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500 font-medium">{title}</span>
        <div className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center',
          isIncome ? 'bg-income-light' : 'bg-expense-light'
        )}>
          {isIncome ? (
            <svg className="w-4 h-4 text-income" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-expense" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
        </div>
      </div>
      <p className={cn(
        'text-xl font-bold',
        isIncome ? 'text-income' : 'text-expense'
      )}>
        {formatIDR(amount)}
      </p>
      <p className="text-xs text-gray-400 mt-1">Bulan Ini</p>
    </div>
  )
}
