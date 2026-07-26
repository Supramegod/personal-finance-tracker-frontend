import { generateUUID } from './utils'

/**
 * ============================================
 * Mock Data — Personal Finance Tracker
 * Simulasi response API untuk development
 * Semua function return Promise (simulasi delay ~300ms)
 * ============================================
 */

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

// ============================================
// USER
// ============================================
const mockUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'admin@example.com',
  full_name: 'Admin Utama',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z',
}

// ============================================
// CATEGORIES
// ============================================
const mockCategories = [
  // Income
  { id: 'cat-income-001', user_id: mockUser.id, name: 'Gaji', type: 'income', icon: 'salary', is_default: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-income-002', user_id: mockUser.id, name: 'Freelance', type: 'income', icon: 'freelance', is_default: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-income-003', user_id: mockUser.id, name: 'Bisnis', type: 'income', icon: 'business', is_default: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-income-004', user_id: mockUser.id, name: 'Investasi', type: 'income', icon: 'investment', is_default: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-income-005', user_id: mockUser.id, name: 'Hadiah', type: 'income', icon: 'gift', is_default: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-income-006', user_id: mockUser.id, name: 'Lainnya', type: 'income', icon: 'other_income', is_default: true, created_at: '2026-01-01T00:00:00Z' },

  // Expense
  { id: 'cat-expense-001', user_id: mockUser.id, name: 'Makan & Minum', type: 'expense', icon: 'food', is_default: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-expense-002', user_id: mockUser.id, name: 'Transportasi', type: 'expense', icon: 'transport', is_default: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-expense-003', user_id: mockUser.id, name: 'Belanja', type: 'expense', icon: 'shopping', is_default: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-expense-004', user_id: mockUser.id, name: 'Hiburan', type: 'expense', icon: 'entertainment', is_default: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-expense-005', user_id: mockUser.id, name: 'Kesehatan', type: 'expense', icon: 'health', is_default: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-expense-006', user_id: mockUser.id, name: 'Pendidikan', type: 'expense', icon: 'education', is_default: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-expense-007', user_id: mockUser.id, name: 'Tagihan', type: 'expense', icon: 'bill', is_default: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-expense-008', user_id: mockUser.id, name: 'Tabungan', type: 'expense', icon: 'savings', is_default: true, created_at: '2026-01-01T00:00:00Z' },
  { id: 'cat-expense-009', user_id: mockUser.id, name: 'Lainnya', type: 'expense', icon: 'other_expense', is_default: true, created_at: '2026-01-01T00:00:00Z' },
]

// Helper untuk ambil nama kategori
function getCategoryName(categoryId) {
  const cat = mockCategories.find((c) => c.id === categoryId)
  return cat ? cat.name : 'Unknown'
}

// ============================================
// TRANSACTIONS — 20 items dengan berbagai kategori
// ============================================
const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

function daysAgo(n) {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

const mockTransactions = [
  {
    id: 'tx-001', user_id: mockUser.id,
    category_id: 'cat-income-001', category_name: 'Gaji',
    type: 'income', amount: 8500000,
    transaction_date: daysAgo(0),
    note: 'Gaji bulan Juni 2026',
    created_at: '2026-06-20T08:00:00Z', updated_at: '2026-06-20T08:00:00Z',
  },
  {
    id: 'tx-002', user_id: mockUser.id,
    category_id: 'cat-expense-001', category_name: 'Makan & Minum',
    type: 'expense', amount: 45000,
    transaction_date: daysAgo(0),
    note: 'Makan siang di kantin',
    created_at: '2026-06-20T12:00:00Z', updated_at: '2026-06-20T12:00:00Z',
  },
  {
    id: 'tx-003', user_id: mockUser.id,
    category_id: 'cat-expense-002', category_name: 'Transportasi',
    type: 'expense', amount: 20000,
    transaction_date: daysAgo(0),
    note: 'Gojek ke kantor',
    created_at: '2026-06-20T07:30:00Z', updated_at: '2026-06-20T07:30:00Z',
  },
  {
    id: 'tx-004', user_id: mockUser.id,
    category_id: 'cat-income-002', category_name: 'Freelance',
    type: 'income', amount: 2500000,
    transaction_date: daysAgo(2),
    note: 'Project website klien',
    created_at: '2026-06-18T14:00:00Z', updated_at: '2026-06-18T14:00:00Z',
  },
  {
    id: 'tx-005', user_id: mockUser.id,
    category_id: 'cat-expense-003', category_name: 'Belanja',
    type: 'expense', amount: 350000,
    transaction_date: daysAgo(3),
    note: 'Belanja bulanan di supermarket',
    created_at: '2026-06-17T10:00:00Z', updated_at: '2026-06-17T10:00:00Z',
  },
  {
    id: 'tx-006', user_id: mockUser.id,
    category_id: 'cat-expense-007', category_name: 'Tagihan',
    type: 'expense', amount: 550000,
    transaction_date: daysAgo(5),
    note: 'Listrik & air bulan ini',
    created_at: '2026-06-15T09:00:00Z', updated_at: '2026-06-15T09:00:00Z',
  },
  {
    id: 'tx-007', user_id: mockUser.id,
    category_id: 'cat-expense-004', category_name: 'Hiburan',
    type: 'expense', amount: 150000,
    transaction_date: daysAgo(5),
    note: 'Nonton film di bioskop',
    created_at: '2026-06-15T20:00:00Z', updated_at: '2026-06-15T20:00:00Z',
  },
  {
    id: 'tx-008', user_id: mockUser.id,
    category_id: 'cat-expense-005', category_name: 'Kesehatan',
    type: 'expense', amount: 120000,
    transaction_date: daysAgo(7),
    note: 'Check up dokter umum',
    created_at: '2026-06-13T11:00:00Z', updated_at: '2026-06-13T11:00:00Z',
  },
  {
    id: 'tx-009', user_id: mockUser.id,
    category_id: 'cat-income-003', category_name: 'Bisnis',
    type: 'income', amount: 1500000,
    transaction_date: daysAgo(7),
    note: 'Hasil penjualan online',
    created_at: '2026-06-13T16:00:00Z', updated_at: '2026-06-13T16:00:00Z',
  },
  {
    id: 'tx-010', user_id: mockUser.id,
    category_id: 'cat-expense-001', category_name: 'Makan & Minum',
    type: 'expense', amount: 85000,
    transaction_date: daysAgo(8),
    note: 'Makan malam di restoran',
    created_at: '2026-06-12T19:00:00Z', updated_at: '2026-06-12T19:00:00Z',
  },
  {
    id: 'tx-011', user_id: mockUser.id,
    category_id: 'cat-expense-008', category_name: 'Tabungan',
    type: 'expense', amount: 1000000,
    transaction_date: daysAgo(10),
    note: 'Transfer ke rekening tabungan',
    created_at: '2026-06-10T08:00:00Z', updated_at: '2026-06-10T08:00:00Z',
  },
  {
    id: 'tx-012', user_id: mockUser.id,
    category_id: 'cat-expense-002', category_name: 'Transportasi',
    type: 'expense', amount: 150000,
    transaction_date: daysAgo(10),
    note: 'Isi bensin motor',
    created_at: '2026-06-10T07:00:00Z', updated_at: '2026-06-10T07:00:00Z',
  },
  {
    id: 'tx-013', user_id: mockUser.id,
    category_id: 'cat-income-004', category_name: 'Investasi',
    type: 'income', amount: 500000,
    transaction_date: daysAgo(12),
    note: 'Dividen saham',
    created_at: '2026-06-08T09:00:00Z', updated_at: '2026-06-08T09:00:00Z',
  },
  {
    id: 'tx-014', user_id: mockUser.id,
    category_id: 'cat-expense-006', category_name: 'Pendidikan',
    type: 'expense', amount: 300000,
    transaction_date: daysAgo(14),
    note: 'Kursus online programming',
    created_at: '2026-06-06T10:00:00Z', updated_at: '2026-06-06T10:00:00Z',
  },
  {
    id: 'tx-015', user_id: mockUser.id,
    category_id: 'cat-expense-003', category_name: 'Belanja',
    type: 'expense', amount: 250000,
    transaction_date: daysAgo(15),
    note: 'Beli baju baru',
    created_at: '2026-06-05T14:00:00Z', updated_at: '2026-06-05T14:00:00Z',
  },
  {
    id: 'tx-016', user_id: mockUser.id,
    category_id: 'cat-expense-001', category_name: 'Makan & Minum',
    type: 'expense', amount: 35000,
    transaction_date: daysAgo(16),
    note: 'Sarapan pagi',
    created_at: '2026-06-04T07:00:00Z', updated_at: '2026-06-04T07:00:00Z',
  },
  {
    id: 'tx-017', user_id: mockUser.id,
    category_id: 'cat-income-005', category_name: 'Hadiah',
    type: 'income', amount: 200000,
    transaction_date: daysAgo(18),
    note: 'Hadiah ulang tahun',
    created_at: '2026-06-02T12:00:00Z', updated_at: '2026-06-02T12:00:00Z',
  },
  {
    id: 'tx-018', user_id: mockUser.id,
    category_id: 'cat-expense-004', category_name: 'Hiburan',
    type: 'expense', amount: 75000,
    transaction_date: daysAgo(20),
    note: 'Subscription Spotify',
    created_at: '2026-05-31T06:00:00Z', updated_at: '2026-05-31T06:00:00Z',
  },
  {
    id: 'tx-019', user_id: mockUser.id,
    category_id: 'cat-expense-007', category_name: 'Tagihan',
    type: 'expense', amount: 100000,
    transaction_date: daysAgo(22),
    note: 'Pulsa & kuota internet',
    created_at: '2026-05-29T08:00:00Z', updated_at: '2026-05-29T08:00:00Z',
  },
  {
    id: 'tx-020', user_id: mockUser.id,
    category_id: 'cat-expense-001', category_name: 'Makan & Minum',
    type: 'expense', amount: 65000,
    transaction_date: daysAgo(25),
    note: 'Makan bersama teman',
    created_at: '2026-05-26T19:00:00Z', updated_at: '2026-05-26T19:00:00Z',
  },
]

// Urutkan dari yang terbaru
mockTransactions.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))

// ============================================
// MOCK API FUNCTIONS
// ============================================

/**
 * Login — mock autentikasi
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{access_token: string, refresh_token: string, user: object}>}
 */
export async function mockLogin(email, password) {
  await delay()
  if (email === 'admin@example.com' && password === 'admin123') {
    const accessToken = 'mock-access-token-' + Date.now()
    const refreshToken = 'mock-refresh-token-' + Date.now()
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { ...mockUser },
    }
  }
  throw {
    response: {
      status: 401,
      data: { error: { code: 'AUTH_FAILED', message: 'Email atau password salah' } },
    },
  }
}

/**
 * Get list transaksi dengan filter & pagination
 * @param {object} params
 * @returns {Promise<{data: array, total: number, page: number, limit: number}>}
 */
export async function mockFetchTransactions(params = {}) {
  await delay()
  let filtered = [...mockTransactions]

  // Filter by type
  if (params.type && params.type !== 'all') {
    filtered = filtered.filter((t) => t.type === params.type)
  }

  // Filter by category
  if (params.category_id) {
    filtered = filtered.filter((t) => t.category_id === params.category_id)
  }

  // Filter by date range
  if (params.from) {
    const fromDate = new Date(params.from)
    filtered = filtered.filter((t) => new Date(t.transaction_date) >= fromDate)
  }
  if (params.to) {
    const toDate = new Date(params.to)
    toDate.setDate(toDate.getDate() + 1) // include end date
    filtered = filtered.filter((t) => new Date(t.transaction_date) <= toDate)
  }

  // Search in note
  if (params.search) {
    const q = params.search.toLowerCase()
    filtered = filtered.filter(
      (t) =>
        t.note?.toLowerCase().includes(q) ||
        t.category_name.toLowerCase().includes(q)
    )
  }

  // Sort by date desc
  filtered.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))

  // Pagination
  const page = params.page || 1
  const limit = params.limit || 20
  const total = filtered.length
  const start = (page - 1) * limit
  const data = filtered.slice(start, start + limit)

  return { data, total, page, limit }
}

/**
 * Create transaksi baru
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function mockCreateTransaction(data) {
  await delay()
  const newTx = {
    id: generateUUID(),
    user_id: mockUser.id,
    category_id: data.category_id,
    category_name: getCategoryName(data.category_id),
    type: data.type,
    amount: Number(data.amount),
    transaction_date: data.transaction_date,
    note: data.note || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  mockTransactions.unshift(newTx)
  return newTx
}

/**
 * Update transaksi
 * @param {string} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function mockUpdateTransaction(id, data) {
  await delay()
  const index = mockTransactions.findIndex((t) => t.id === id)
  if (index === -1) throw new Error('Transaksi tidak ditemukan')

  const updated = {
    ...mockTransactions[index],
    ...data,
    category_name: data.category_id ? getCategoryName(data.category_id) : mockTransactions[index].category_name,
    updated_at: new Date().toISOString(),
  }
  mockTransactions[index] = updated
  return updated
}

/**
 * Delete transaksi (soft delete)
 * @param {string} id
 * @returns {Promise<{message: string}>}
 */
export async function mockDeleteTransaction(id) {
  await delay()
  const index = mockTransactions.findIndex((t) => t.id === id)
  if (index === -1) throw new Error('Transaksi tidak ditemukan')
  mockTransactions.splice(index, 1)
  return { message: 'transaction deleted successfully' }
}

/**
 * Get balance terkini
 * @returns {Promise<{balance: number}>}
 */
export async function mockFetchBalance() {
  await delay()
  const totalIncome = mockTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = mockTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  return { balance: totalIncome - totalExpense }
}

/**
 * Get report — summary income vs expense per periode
 * @param {object} params
 * @returns {Promise<{total_income: number, total_expense: number, net: number, periods: array}>}
 */
export async function mockFetchReport(params = {}) {
  await delay()
  const period = params.period || 'monthly'

  // Group transactions by period
  const grouped = {}
  mockTransactions.forEach((t) => {
    let key
    const d = new Date(t.transaction_date)
    if (period === 'daily') {
      key = d.toISOString().split('T')[0]
    } else if (period === 'weekly') {
      const startOfWeek = new Date(d)
      startOfWeek.setDate(d.getDate() - d.getDay())
      key = startOfWeek.toISOString().split('T')[0]
    } else {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    }

    if (!grouped[key]) grouped[key] = { period: key, total_income: 0, total_expense: 0 }
    if (t.type === 'income') grouped[key].total_income += t.amount
    else grouped[key].total_expense += t.amount
  })

  const periods = Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period))

  const totalIncome = periods.reduce((sum, p) => sum + p.total_income, 0)
  const totalExpense = periods.reduce((sum, p) => sum + p.total_expense, 0)

  return {
    total_income: totalIncome,
    total_expense: totalExpense,
    net: totalIncome - totalExpense,
    periods,
  }
}

/**
 * Get all categories
 * @param {object} params
 * @returns {Promise<{data: array}>}
 */
export async function mockFetchCategories(params = {}) {
  await delay()
  let filtered = [...mockCategories]
  if (params.type) {
    filtered = filtered.filter((c) => c.type === params.type)
  }
  return { data: filtered }
}

// ============================================
// CALENDAR — Mock data untuk fitur kalender
// ============================================

/**
 * Generate mock data kalender untuk bulan tertentu
 * @param {string} month — format "YYYY-MM", misal "2026-06"
 * @returns {Promise<{data: array}>}
 */
export async function mockFetchCalendar(month) {
  await delay()
  const [yearStr, monthStr] = month.split('-')
  const year = parseInt(yearStr)
  const mon = parseInt(monthStr)
  const daysInMonth = new Date(year, mon, 0).getDate()

  const days = []
  for (let day = 1; day <= daysInMonth; day++) {
    if (Math.random() > 0.4) {
      // 60% probabilitas ada transaksi
      const income = Math.random() > 0.7 ? Math.floor(Math.random() * 500000) : 0
      const expense = Math.random() > 0.3 ? Math.floor(Math.random() * 200000) : 0
      days.push({
        date: `${month}-${String(day).padStart(2, '0')}`,
        total_income: income,
        total_expense: expense,
        count: Math.floor(Math.random() * 4) + 1,
      })
    }
  }
  return { data: days }
}

/**
 * Mock transaksi per tanggal tertentu
 * @param {string} date — format "YYYY-MM-DD", misal "2026-06-20"
 * @returns {Promise<{data: array}>}
 */
export async function mockFetchTransactionsByDate(date) {
  await delay()
  const categories = mockCategories.filter((c) => c.type === 'expense')
  const incomeCategories = mockCategories.filter((c) => c.type === 'income')

  // Generate 1-5 transaksi random untuk hari itu
  const count = Math.floor(Math.random() * 5) + 1
  const transactions = []

  for (let i = 0; i < count; i++) {
    const isIncome = Math.random() > 0.7
    const catList = isIncome ? incomeCategories : categories
    const cat = catList[Math.floor(Math.random() * catList.length)]

    const hour = String(Math.floor(Math.random() * 14) + 7).padStart(2, '0')
    const minute = String(Math.floor(Math.random() * 60)).padStart(2, '0')

    transactions.push({
      id: `tx-cal-${date}-${i}`,
      type: isIncome ? 'income' : 'expense',
      amount: isIncome
        ? Math.floor(Math.random() * 5000000) + 100000
        : Math.floor(Math.random() * 200000) + 5000,
      category_name: cat.name,
      transaction_date: date,
      note: `${isIncome ? 'Pemasukan' : 'Pengeluaran'} ${cat.name}`,
      created_at: `${date}T${hour}:${minute}:00Z`,
    })
  }

  // Urutkan berdasarkan jam
  transactions.sort((a, b) => a.created_at.localeCompare(b.created_at))

  return { data: transactions }
}
