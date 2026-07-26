import { formatIDR } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function BalanceCard({ balance, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="skeleton h-4 w-24 mb-4" />
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-3 w-32" />
      </div>
    )
  }

  const isPositive = balance >= 0

  return (
    <div className="bg-gradient-to-br from-primary to-primary/90 rounded-xl p-6 text-white shadow-md">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <span className="text-sm text-white/80 font-medium">Saldo Terkini</span>
      </div>
      <p className="text-3xl font-bold mb-1">
        {formatIDR(balance)}
      </p>
      <p className={cn(
        'text-sm',
        isPositive ? 'text-green-200' : 'text-red-200'
      )}>
        {isPositive ? '▲ Positif' : '▼ Negatif'}
      </p>
    </div>
  )
}
