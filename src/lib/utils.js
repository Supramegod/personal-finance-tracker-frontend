import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge TailwindCSS classes with conflict resolution
 * @param  {...(string|object|boolean)} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format number to IDR currency
 * @param {number} amount
 * @returns {string}
 */
export function formatIDR(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Parse date-only string (YYYY-MM-DD) sebagai tengah malam waktu lokal.
 * `new Date('2026-06-20')` diparse sebagai UTC, sehingga di timezone negatif
 * tanggalnya mundur satu hari saat ditampilkan. Parser ini menghindari itu.
 * @param {string|Date} date
 * @returns {Date}
 */
function toLocalDate(date) {
  if (date instanceof Date) return date
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(`${date}T00:00:00`)
  }
  return new Date(date)
}

/**
 * Format date to Indonesian locale
 * @param {string|Date} date
 * @param {object} options
 * @returns {string}
 */
export function formatDate(date, options = {}) {
  const dateObj = toLocalDate(date)
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  return dateObj.toLocaleDateString('id-ID', { ...defaultOptions, ...options })
}

/**
 * Format date to ISO string (YYYY-MM-DD) berdasarkan komponen tanggal LOKAL.
 * Sengaja tidak memakai toISOString() yang mengonversi ke UTC — di UTC+7 itu
 * membuat tanggal hari ini mundur satu hari sebelum pukul 07:00.
 * @param {Date|string} date
 * @returns {string}
 */
export function toISODate(date) {
  const d = toLocalDate(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

/**
 * Format date to month string (YYYY-MM) berdasarkan komponen tanggal LOKAL.
 * @param {Date|string} date
 * @returns {string}
 */
export function toISOMonth(date) {
  return toISODate(date).slice(0, 7)
}

/**
 * Generate a simple UUID v4
 * @returns {string}
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
