/**
 * @typedef {Object} Balance
 * @property {number} balance - Saldo terkini
 */

/**
 * @typedef {Object} ReportRow
 * @property {string} period - Periode (YYYY-MM-DD atau YYYY-MM)
 * @property {number} total_income
 * @property {number} total_expense
 */

/**
 * @typedef {Object} ReportResponse
 * @property {number} total_income
 * @property {number} total_expense
 * @property {number} net
 * @property {ReportRow[]} periods
 */

export {}
