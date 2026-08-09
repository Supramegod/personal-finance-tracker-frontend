import { describe, it, expect } from 'vitest'
import { parseIDRInput, formatIDRInput } from '@/lib/utils'

describe('parseIDRInput', () => {
  it.each([
    ['250000', '250000'],
    ['250.000', '250000'],
    ['Rp 1.500.000', '1500000'],
    ['1 500 000', '1500000'],
    ['abc', ''],
    ['', ''],
    ['0', '0'],
    ['007', '7'],
    ['000', '0'],
  ])('parseIDRInput(%j) -> %j', (input, expected) => {
    expect(parseIDRInput(input)).toBe(expected)
  })

  it('menganggap kosong sebagai belum diisi, bukan nol', () => {
    // Bedanya penting: target tabungan kosong dikirim null, target 0 ditolak.
    expect(parseIDRInput('')).toBe('')
    expect(parseIDRInput('0')).toBe('0')
  })

  it('membulatkan angka desimal, bukan memperlakukan titiknya sebagai pemisah ribuan', () => {
    // Regresi: kolom amount DECIMAL(15,2). String(25000.5) = "25000.5", dan
    // membuang titiknya menghasilkan 250005 — salah 10x saat prefill form edit.
    expect(parseIDRInput(25000.5)).toBe('25001')
    expect(parseIDRInput(25000.4)).toBe('25000')
    expect(parseIDRInput(1500000)).toBe('1500000')
  })

  it('tahan terhadap null dan undefined', () => {
    expect(parseIDRInput(null)).toBe('')
    expect(parseIDRInput(undefined)).toBe('')
  })
})

describe('formatIDRInput', () => {
  it.each([
    ['250000', '250.000'],
    ['1500000', '1.500.000'],
    ['1000', '1.000'],
    ['999', '999'],
    ['', ''],
    ['0', '0'],
  ])('formatIDRInput(%j) -> %j', (input, expected) => {
    expect(formatIDRInput(input)).toBe(expected)
  })

  it('menerima angka maupun string', () => {
    expect(formatIDRInput(1500000)).toBe('1.500.000')
    expect(formatIDRInput('1500000')).toBe('1.500.000')
  })

  it('memformat ulang teks yang sudah terformat tanpa berubah', () => {
    // Dipanggil tiap keystroke, jadi harus idempoten.
    expect(formatIDRInput(formatIDRInput('250000'))).toBe('250.000')
  })
})
