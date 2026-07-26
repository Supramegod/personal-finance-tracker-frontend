import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchCategories } from '@/store/slices/categorySlice'
import { setFilters, resetFilters } from '@/store/slices/transactionSlice'
import { cn } from '@/lib/utils'

export default function TransactionFilter({ onSearch }) {
  const dispatch = useAppDispatch()
  const { items: categories } = useAppSelector((state) => state.categories)

  const [localFilters, setLocalFilters] = useState({
    type: 'all',
    category_id: '',
    from: '',
    to: '',
    search: '',
  })

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  const handleChange = (field, value) => {
    setLocalFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleSearch = () => {
    dispatch(setFilters(localFilters))
    if (onSearch) onSearch()
  }

  const handleReset = () => {
    const empty = { type: 'all', category_id: '', from: '', to: '', search: '' }
    setLocalFilters(empty)
    dispatch(resetFilters())
    if (onSearch) onSearch()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const hasActiveFilters =
    localFilters.type !== 'all' ||
    localFilters.category_id !== '' ||
    localFilters.from !== '' ||
    localFilters.to !== '' ||
    localFilters.search !== ''

  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const allCategories =
    localFilters.type === 'all'
      ? categories
      : localFilters.type === 'income'
        ? incomeCategories
        : expenseCategories

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Cari</label>
          <input
            type="text"
            value={localFilters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari catatan..."
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Date From */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Dari Tanggal</label>
          <input
            type="date"
            value={localFilters.from}
            onChange={(e) => handleChange('from', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={localFilters.to}
            onChange={(e) => handleChange('to', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tipe</label>
          <select
            value={localFilters.type}
            onChange={(e) => {
              handleChange('type', e.target.value)
              handleChange('category_id', '')
            }}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
          >
            <option value="all">Semua</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
          <select
            value={localFilters.category_id}
            onChange={(e) => handleChange('category_id', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
          >
            <option value="">Semua Kategori</option>
            {allCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Cari
          </span>
        </button>
        {hasActiveFilters && (
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-600 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Reset Filter
          </button>
        )}
      </div>
    </div>
  )
}
