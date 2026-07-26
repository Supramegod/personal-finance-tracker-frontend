import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatIDR } from '@/lib/utils'
import { cn } from '@/lib/utils'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3">
        <p className="text-sm font-medium text-text mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-semibold" style={{ color: entry.color }}>
              {formatIDR(entry.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function IncomeExpenseChart({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="skeleton h-5 w-48 mb-6" />
        <div className="skeleton h-64 w-full" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-text mb-4">
          Tren Income vs Expense
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          Belum ada data untuk ditampilkan
        </div>
      </div>
    )
  }

  // Format period labels. Backend mengirim period sebagai tanggal RFC3339
  // (2026-06-01T00:00:00Z), sedangkan mock memakai "YYYY-MM". Tangani keduanya.
  const chartData = data.map((item) => {
    const p = String(item.period)
    let label
    if (/^\d{4}-\d{2}$/.test(p)) {
      // "YYYY-MM" — bulanan
      label = new Date(p + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
    } else {
      // RFC3339 / tanggal penuh. Awal-bulan (tanggal 1) diperlakukan bulanan.
      const d = new Date(p)
      label = d.getDate() === 1
        ? d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
        : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    }
    return { ...item, period: label }
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-text mb-6">
        Tren Income vs Expense
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} barGap={4} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`
              if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`
              return value
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <Bar
            dataKey="total_income"
            name="Pemasukan"
            fill="#16A34A"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
          <Bar
            dataKey="total_expense"
            name="Pengeluaran"
            fill="#DC2626"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
