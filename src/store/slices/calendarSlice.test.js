import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import api from '@/lib/api'
import reducer, {
  setSelectedDate,
  clearDayTransactions,
  fetchCalendar,
  fetchDayTransactions,
} from '@/store/slices/calendarSlice'

const makeStore = () => configureStore({ reducer: { calendar: reducer } })
const state = (store) => store.getState().calendar
const backendError = (message) => ({ response: { data: { error: message } } })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchCalendar', () => {
  it('mengirim bulan sebagai param dan mengisi days', async () => {
    api.get.mockResolvedValue({
      data: { data: [{ date: '2026-06-20', income: 0, expense: 50000 }] },
    })

    const store = makeStore()
    await store.dispatch(fetchCalendar('2026-06'))

    expect(api.get).toHaveBeenCalledWith('/transactions/calendar', {
      params: { month: '2026-06' },
    })
    expect(state(store).days).toHaveLength(1)
    expect(state(store).status).toBe('succeeded')
  })

  it('memakai array kosong saat backend tidak mengirim field data', async () => {
    api.get.mockResolvedValue({ data: {} })

    const store = makeStore()
    await store.dispatch(fetchCalendar('2026-06'))

    expect(state(store).days).toEqual([])
  })

  it('mengosongkan days saat gagal — bukan menyisakan data bulan sebelumnya', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [{ date: '2026-05-01' }] } })
    const store = makeStore()
    await store.dispatch(fetchCalendar('2026-05'))
    expect(state(store).days).toHaveLength(1)

    api.get.mockRejectedValueOnce(backendError('Bulan tidak valid'))
    await store.dispatch(fetchCalendar('bukan-bulan'))

    expect(state(store).days).toEqual([])
    expect(state(store).error).toBe('Bulan tidak valid')
  })
})

describe('fetchDayTransactions', () => {
  it('memfilter satu hari dengan from = to = tanggal', async () => {
    api.get.mockResolvedValue({ data: { data: [{ id: 't1' }] } })

    const store = makeStore()
    await store.dispatch(fetchDayTransactions('2026-06-20'))

    expect(api.get).toHaveBeenCalledWith('/transactions', {
      params: { from: '2026-06-20', to: '2026-06-20' },
    })
    expect(state(store).transactions).toHaveLength(1)
    expect(state(store).transactionsStatus).toBe('succeeded')
  })

  it('memakai jalur error terpisah dari kalender', async () => {
    api.get.mockRejectedValue(backendError('Gagal ambil transaksi hari itu'))

    const store = makeStore()
    await store.dispatch(fetchDayTransactions('2026-06-20'))

    expect(state(store).transactionsError).toBe('Gagal ambil transaksi hari itu')
    expect(state(store).error).toBeNull()
    expect(state(store).transactions).toEqual([])
  })
})

describe('reducer sinkron', () => {
  it('setSelectedDate menyimpan tanggal terpilih', () => {
    expect(reducer(undefined, setSelectedDate('2026-06-20')).selectedDate).toBe('2026-06-20')
  })

  it('clearDayTransactions mereset popup tanpa menyentuh days', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [{ date: '2026-06-20' }] } })
    const store = makeStore()
    await store.dispatch(fetchCalendar('2026-06'))

    api.get.mockResolvedValueOnce({ data: { data: [{ id: 't1' }] } })
    await store.dispatch(fetchDayTransactions('2026-06-20'))
    store.dispatch(setSelectedDate('2026-06-20'))

    store.dispatch(clearDayTransactions())

    expect(state(store).transactions).toEqual([])
    expect(state(store).selectedDate).toBeNull()
    expect(state(store).transactionsStatus).toBe('idle')
    expect(state(store).days).toHaveLength(1)
  })
})
