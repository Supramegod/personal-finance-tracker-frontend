/**
 * @typedef {Object} Transaction
 * @property {string} id - UUID
 * @property {string} user_id - UUID
 * @property {string} category_id - UUID
 * @property {string} category_name - Nama kategori
 * @property {'income' | 'expense'} type - Tipe transaksi
 * @property {number} amount - Jumlah (selalu > 0)
 * @property {string} transaction_date - YYYY-MM-DD
 * @property {string} [note] - Catatan tambahan
 * @property {string} created_at - ISO datetime
 * @property {string} updated_at - ISO datetime
 */

/**
 * @typedef {Object} PaginatedTransactions
 * @property {Transaction[]} data
 * @property {number} total
 * @property {number} page
 * @property {number} limit
 */

export {}
