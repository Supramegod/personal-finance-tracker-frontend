/**
 * @typedef {Object} SavingsGoal
 * @property {string} id
 * @property {string} name
 * @property {number|null} target_amount - null = celengan bebas tanpa target
 * @property {string|null} target_date - YYYY-MM-DD
 * @property {string} icon
 * @property {string} color
 * @property {'active'|'completed'|'archived'} status
 * @property {string} note
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * SavingsGoal plus nilai turunan yang dihitung backend. Semua field turunan
 * bernilai null untuk pot tanpa target — bedakan dari 0.
 *
 * @typedef {Object} SavingsGoalWithProgress
 * @property {number} saved_amount - SUM(setoran) - SUM(penarikan)
 * @property {number} entry_count
 * @property {number|null} progress - 0..1
 * @property {number|null} remaining_amount
 * @property {number|null} months_left
 * @property {number|null} suggested_monthly - sisa dibagi bulan tersisa
 * @property {boolean|null} is_on_track
 */

/**
 * @typedef {Object} SavingsEntry
 * @property {string} id
 * @property {string} goal_id
 * @property {string} user_id
 * @property {string|null} transaction_id - transaksi bertanda is_transfer
 * @property {'deposit'|'withdraw'} direction
 * @property {number} amount
 * @property {string} entry_date - YYYY-MM-DD
 * @property {string} note
 * @property {string} created_at
 */

export {}
