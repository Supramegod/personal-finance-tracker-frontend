import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import api from '@/lib/api'
import reducer, {
  clearAIInsight,
  clearAIError,
  fetchAIConsent,
  updateAIConsent,
  fetchLatestAIInsight,
  fetchMonthlyAIInsight,
} from '@/store/slices/aiInsightSlice'

const makeStore = () => configureStore({ reducer: { aiInsight: reducer } })
const state = (store) => store.getState().aiInsight
const backendError = (message) => ({ response: { data: { error: message } } })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('consent', () => {
  it('memuat status persetujuan per kelompok', async () => {
    api.get.mockResolvedValue({ data: { enabled: true } })

    const store = makeStore()
    await store.dispatch(fetchAIConsent('g1'))

    expect(api.get).toHaveBeenCalledWith('/groups/g1/ai-consent')
    expect(state(store).consent).toEqual({ enabled: true })
    expect(state(store).consentStatus).toBe('succeeded')
  })

  it('mengirim enabled saat memperbarui persetujuan', async () => {
    api.put.mockResolvedValue({ data: { enabled: true } })

    const store = makeStore()
    await store.dispatch(updateAIConsent({ groupId: 'g1', enabled: true }))

    expect(api.put).toHaveBeenCalledWith('/groups/g1/ai-consent', { enabled: true })
    expect(state(store).consent).toEqual({ enabled: true })
  })

  it('mencatat error saat gagal memuat persetujuan', async () => {
    api.get.mockRejectedValue(backendError('Tidak berhak'))

    const store = makeStore()
    await store.dispatch(fetchAIConsent('g1'))

    expect(state(store).consentStatus).toBe('failed')
    expect(state(store).error).toBe('Tidak berhak')
  })
})

describe('mematikan consent membuang insight yang sudah termuat', () => {
  it('menghapus latest dan monthly saat enabled menjadi false', async () => {
    const store = makeStore()

    api.get.mockResolvedValueOnce({ data: { month: '2026-06', summary: 'Pengeluaran naik' } })
    await store.dispatch(fetchLatestAIInsight())
    api.get.mockResolvedValueOnce({ data: { month: '2026-05', summary: 'Stabil' } })
    await store.dispatch(fetchMonthlyAIInsight('2026-05'))

    expect(state(store).latest).not.toBeNull()
    expect(state(store).monthly).not.toBeNull()

    api.put.mockResolvedValueOnce({ data: { enabled: false } })
    await store.dispatch(updateAIConsent({ groupId: 'g1', enabled: false }))

    // Kalau user mencabut persetujuan, hasil analisis yang sudah tampil harus
    // ikut hilang — bukan menunggu reload halaman.
    expect(state(store).latest).toBeNull()
    expect(state(store).monthly).toBeNull()
  })

  it('menyalakan consent TIDAK menghapus insight yang ada', async () => {
    const store = makeStore()

    api.get.mockResolvedValueOnce({ data: { month: '2026-06', summary: 'Pengeluaran naik' } })
    await store.dispatch(fetchLatestAIInsight())

    api.put.mockResolvedValueOnce({ data: { enabled: true } })
    await store.dispatch(updateAIConsent({ groupId: 'g1', enabled: true }))

    expect(state(store).latest).not.toBeNull()
  })
})

describe('insight', () => {
  it('mengambil insight terbaru dari endpoint /latest', async () => {
    api.get.mockResolvedValue({ data: { month: '2026-06', summary: 'Pengeluaran naik' } })

    const store = makeStore()
    await store.dispatch(fetchLatestAIInsight())

    expect(api.get).toHaveBeenCalledWith('/summary/ai-insights/latest')
    expect(state(store).latest.month).toBe('2026-06')
    expect(state(store).latestStatus).toBe('succeeded')
  })

  it('mengirim bulan sebagai param untuk insight bulanan', async () => {
    api.get.mockResolvedValue({ data: { month: '2026-05', summary: 'Stabil' } })

    const store = makeStore()
    await store.dispatch(fetchMonthlyAIInsight('2026-05'))

    expect(api.get).toHaveBeenCalledWith('/summary/ai-insights', {
      params: { month: '2026-05' },
    })
    expect(state(store).monthlyStatus).toBe('succeeded')
  })

  it('status latest dan monthly berdiri sendiri', async () => {
    const store = makeStore()

    api.get.mockResolvedValueOnce({ data: { month: '2026-06' } })
    await store.dispatch(fetchLatestAIInsight())

    api.get.mockRejectedValueOnce(backendError('Belum ada insight bulan itu'))
    await store.dispatch(fetchMonthlyAIInsight('2020-01'))

    expect(state(store).latestStatus).toBe('succeeded')
    expect(state(store).monthlyStatus).toBe('failed')
    expect(state(store).error).toBe('Belum ada insight bulan itu')
  })
})

describe('reducer sinkron', () => {
  it('clearAIInsight mengembalikan seluruh state ke awal', async () => {
    api.get.mockResolvedValueOnce({ data: { month: '2026-06' } })
    const store = makeStore()
    await store.dispatch(fetchLatestAIInsight())

    store.dispatch(clearAIInsight())

    expect(state(store)).toEqual({
      consent: null,
      consentStatus: 'idle',
      latest: null,
      latestStatus: 'idle',
      monthly: null,
      monthlyStatus: 'idle',
      error: null,
    })
  })

  it('clearAIError hanya menghapus error', async () => {
    api.get.mockRejectedValueOnce(backendError('boom'))
    const store = makeStore()
    await store.dispatch(fetchAIConsent('g1'))
    expect(state(store).error).toBe('boom')

    store.dispatch(clearAIError())

    expect(state(store).error).toBeNull()
    expect(state(store).consentStatus).toBe('failed')
  })
})
