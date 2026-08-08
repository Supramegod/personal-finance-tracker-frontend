import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import api from '@/lib/api'
import reducer, { fetchBalance, fetchReport } from '@/store/slices/balanceSlice'

const makeStore = () => configureStore({ reducer: { balance: reducer } })
const state = (store) => store.getState().balance
const backendError = (message) => ({ response: { data: { error: message } } })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchBalance', () => {
  it('mengambil angka saldo dari payload.balance', async () => {
    api.get.mockResolvedValue({ data: { balance: 2500000 } })

    const store = makeStore()
    await store.dispatch(fetchBalance())

    expect(api.get).toHaveBeenCalledWith('/summary/balance')
    expect(state(store).balance).toBe(2500000)
    expect(state(store).status).toBe('succeeded')
  })

  it('menyimpan pesan error backend', async () => {
    api.get.mockRejectedValue(backendError('Saldo tidak tersedia'))

    const store = makeStore()
    await store.dispatch(fetchBalance())

    expect(state(store).status).toBe('failed')
    expect(state(store).error).toBe('Saldo tidak tersedia')
  })
})

describe('fetchReport', () => {
  it('meneruskan from & to ke backend — keduanya wajib, tanpa itu backend 400', async () => {
    api.get.mockResolvedValue({
      data: { periods: [], total_income: 0, total_expense: 0, net: 0 },
    })

    const store = makeStore()
    await store.dispatch(fetchReport({ from: '2026-06-01', to: '2026-06-30' }))

    expect(api.get).toHaveBeenCalledWith('/summary/report', {
      params: { from: '2026-06-01', to: '2026-06-30' },
    })
  })

  it('mengganti seluruh objek report dengan payload', async () => {
    api.get.mockResolvedValue({
      data: {
        periods: [{ period: '2026-06', income: 5000, expense: 2000 }],
        total_income: 5000,
        total_expense: 2000,
        net: 3000,
      },
    })

    const store = makeStore()
    await store.dispatch(fetchReport({ from: '2026-06-01', to: '2026-06-30' }))

    expect(state(store).reportStatus).toBe('succeeded')
    expect(state(store).report.net).toBe(3000)
    expect(state(store).report.periods).toHaveLength(1)
  })
})

describe('status saldo dan laporan terpisah', () => {
  it('laporan gagal tidak menjatuhkan status saldo', async () => {
    api.get.mockResolvedValueOnce({ data: { balance: 100 } })
    const store = makeStore()
    await store.dispatch(fetchBalance())

    api.get.mockRejectedValueOnce(backendError('rentang tidak valid'))
    await store.dispatch(fetchReport({ from: '', to: '' }))

    expect(state(store).status).toBe('succeeded')
    expect(state(store).reportStatus).toBe('failed')
    expect(state(store).balance).toBe(100)
  })

  it('fetchBalance.pending membersihkan error, fetchReport.pending TIDAK', async () => {
    api.get.mockRejectedValueOnce(backendError('error lama'))
    const store = makeStore()
    await store.dispatch(fetchReport({ from: '2026-06-01', to: '2026-06-30' }))
    expect(state(store).error).toBe('error lama')

    // Dispatch report lagi: error lama tetap tinggal karena pending-nya
    // tidak mereset error.
    api.get.mockResolvedValueOnce({ data: { periods: [] } })
    await store.dispatch(fetchReport({ from: '2026-07-01', to: '2026-07-31' }))
    expect(state(store).error).toBe('error lama')

    // Sebaliknya, fetchBalance mereset error saat mulai.
    api.get.mockResolvedValueOnce({ data: { balance: 0 } })
    await store.dispatch(fetchBalance())
    expect(state(store).error).toBeNull()
  })
})
