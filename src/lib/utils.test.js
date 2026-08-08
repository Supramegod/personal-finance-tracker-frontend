import { describe, it, expect } from 'vitest'
import { cn, formatIDR, formatDate, toISODate, toISOMonth } from '@/lib/utils'

// Fokus tes ini: perilaku tanggal yang gampang rusak diam-diam.
// toISODate/toISOMonth sengaja TIDAK memakai toISOString(), dan parser internal
// sengaja tidak memakai `new Date('YYYY-MM-DD')` — keduanya menggeser tanggal
// satu hari di zona waktu positif seperti UTC+7. Tes di bawah mengunci itu.

describe('toISODate', () => {
  it('mempertahankan tanggal saat input berupa string YYYY-MM-DD', () => {
    expect(toISODate('2026-06-20')).toBe('2026-06-20')
  })

  it('memakai komponen tanggal LOKAL, bukan UTC', () => {
    // Tengah malam waktu lokal. Kalau implementasinya pakai toISOString(),
    // di UTC+7 hasilnya mundur jadi 2026-06-19.
    const localMidnight = new Date(2026, 5, 20, 0, 0, 0)
    expect(toISODate(localMidnight)).toBe('2026-06-20')
  })

  it('tidak mundur satu hari untuk waktu dini hari', () => {
    // 06:30 lokal — di UTC+7 ini masih 23:30 UTC hari sebelumnya.
    const earlyMorning = new Date(2026, 0, 1, 6, 30, 0)
    expect(toISODate(earlyMorning)).toBe('2026-01-01')
  })

  it('memberi padding nol pada bulan dan tanggal satu digit', () => {
    expect(toISODate(new Date(2026, 2, 5))).toBe('2026-03-05')
  })
})

describe('toISOMonth', () => {
  it('memotong ke YYYY-MM', () => {
    expect(toISOMonth('2026-06-20')).toBe('2026-06')
  })

  it('konsisten dengan toISODate untuk objek Date lokal', () => {
    const d = new Date(2026, 11, 31, 23, 0, 0)
    expect(toISOMonth(d)).toBe('2026-12')
  })
})

describe('formatDate', () => {
  it('menampilkan tanggal yang sama dengan input string', () => {
    const result = formatDate('2026-06-20')
    expect(result).toContain('20')
    expect(result).toContain('2026')
  })

  it('menerima override options', () => {
    const result = formatDate('2026-06-20', { month: 'long' })
    expect(result.toLowerCase()).toContain('juni')
  })
})

describe('formatIDR', () => {
  it('memformat sebagai rupiah tanpa desimal', () => {
    expect(formatIDR(1500000)).toMatch(/^Rp\s?1\.500\.000$/)
  })

  it('menangani nol', () => {
    expect(formatIDR(0)).toMatch(/^Rp\s?0$/)
  })

  it('membulatkan desimal', () => {
    expect(formatIDR(1000.6)).toMatch(/^Rp\s?1\.001$/)
  })
})

describe('cn', () => {
  it('menyelesaikan konflik kelas Tailwind — yang terakhir menang', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('mengabaikan nilai falsy', () => {
    expect(cn('text-sm', false && 'hidden', undefined)).toBe('text-sm')
  })
})
