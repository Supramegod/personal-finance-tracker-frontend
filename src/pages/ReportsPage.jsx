import { Link } from 'react-router-dom'

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-primary font-medium">Laporan</span>
        </div>
        <h1 className="text-2xl font-bold text-text">Laporan</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="max-w-md mx-auto">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text mb-2">
            Fitur Laporan & Export
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Fitur ini akan tersedia di fase berikutnya. Sementara itu, Anda bisa
            menggunakan halaman Transaksi untuk melihat dan mengelola data keuangan.
          </p>
          <div className="space-y-3 text-left mb-6">
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-income-light text-income-dark flex items-center justify-center text-xs font-bold">✓</span>
              <span className="text-gray-600">Ringkasan income/expense per periode</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-income-light text-income-dark flex items-center justify-center text-xs font-bold">✓</span>
              <span className="text-gray-600">Export CSV transaksi</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold">○</span>
              <span className="text-gray-400">Export PDF laporan keuangan</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold">○</span>
              <span className="text-gray-400">Grafik breakdown kategori</span>
            </div>
          </div>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Ke Halaman Transaksi
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
