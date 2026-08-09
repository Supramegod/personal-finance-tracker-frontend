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

/**
 * Ambil digit dari teks yang diketik user dan kembalikan sebagai string angka
 * polos. Dipakai bersama formatIDRInput untuk input nominal berpemisah ribuan.
 *
 * Semua non-digit dibuang — jadi menempel "Rp 1.500.000" dari mana pun tetap
 * terbaca 1500000. Nol di depan ikut dipangkas supaya "007" tidak lolos ke
 * backend. String kosong berarti "belum diisi", bukan 0.
 *
 * @param {string} text
 * @returns {string} '' atau deretan digit tanpa nol di depan
 */
export function parseIDRInput(text) {
  // Angka dibulatkan lebih dulu. Kolom amount bertipe DECIMAL(15,2), jadi
  // String(25000.5) menghasilkan "25000.5" — dan karena titik di format
  // Indonesia adalah pemisah RIBUAN, pembersihan di bawah akan membacanya
  // sebagai 250005. Salah sepuluh kali lipat, tanpa peringatan apa pun.
  const source = typeof text === 'number' ? String(Math.round(text)) : String(text ?? '')
  const digits = source.replace(/\D/g, '')
  if (digits === '') return ''
  const trimmed = digits.replace(/^0+/, '')
  return trimmed === '' ? '0' : trimmed
}

/**
 * Format angka jadi string berpemisah ribuan gaya Indonesia (titik), TANPA
 * prefix "Rp" — prefix-nya dirender terpisah di dalam field.
 *
 * Sengaja tidak memakai formatIDR: yang itu menempelkan "Rp" dan spasi tak
 * putus, yang akan ikut masuk ke nilai input dan mengacaukan posisi kursor.
 *
 * @param {string|number} value
 * @returns {string}
 */
export function formatIDRInput(value) {
  const digits = parseIDRInput(value)
  if (digits === '') return ''
  return new Intl.NumberFormat('id-ID').format(Number(digits))
}
