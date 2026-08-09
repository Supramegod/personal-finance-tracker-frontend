import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import api from '@/lib/api'
import reducer, {
  clearSavingsError,
  clearSavingsDetail,
  fetchSavings,
  fetchSavingsDetail,
  createSavings,
  updateSavings,
  deleteSavings,
  depositSavings,
  withdrawSavings,
  deleteSavingsEntry,
} from '@/store/slices/savingsSlice'

const makeStore = () => configureStore({ reducer: { savings: reducer } })
const state = (store) => store.getState().savings
const backendError = (message) => ({ response: { data: { error: message } } })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchSavings', () => {
  it('memakai res.data.data dan meneruskan filter status sebagai query param', async () => {
    api.get.mockResolvedValue({
      data: { data: [{ id: 's1', name: 'Dana Darurat', saved_amount: 7500000 }] },
    })

    const store = makeStore()
    await store.dispatch(fetchSavings({ status: 'active' }))

    expect(api.get).toHaveBeenCalledWith('/savings', { params: { status: 'active' } })
    expect(state(store).items).toHaveLength(1)
    expect(state(store).status).toBe('succeeded')
  })

  it('tanpa argumen tetap mengirim params kosong, bukan undefined', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })

    const store = makeStore()
    await store.dispatch(fetchSavings())

    expect(api.get).toHaveBeenCalledWith('/savings', { params: {} })
  })

  it('memakai array kosong saat payload null', async () => {
    api.get.mockResolvedValue({ data: { data: null } })

    const store = makeStore()
    await store.dispatch(fetchSavings())

    expect(state(store).items).toEqual([])
  })

  it('mengosongkan items saat gagal', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [{ id: 's1' }] } })
    const store = makeStore()
    await store.dispatch(fetchSavings())
    expect(state(store).items).toHaveLength(1)

    api.get.mockRejectedValueOnce(backendError('Gagal memuat tabungan'))
    await store.dispatch(fetchSavings())

    expect(state(store).items).toEqual([])
    expect(state(store).status).toBe('failed')
    expect(state(store).error).toBe('Gagal memuat tabungan')
  })
})

describe('fetchSavingsDetail', () => {
  it('menyimpan { goal, entries } apa adanya', async () => {
    api.get.mockResolvedValue({
      data: { goal: { id: 's1', name: 'Motor' }, entries: [{ id: 'e1', direction: 'deposit' }] },
    })

    const store = makeStore()
    await store.dispatch(fetchSavingsDetail('s1'))

    expect(api.get).toHaveBeenCalledWith('/savings/s1')
    expect(state(store).detail.goal.name).toBe('Motor')
    expect(state(store).detail.entries).toHaveLength(1)
    expect(state(store).detailStatus).toBe('succeeded')
  })

  it('mengosongkan detail saat gagal', async () => {
    api.get.mockRejectedValue(backendError('savings goal not found'))

    const store = makeStore()
    await store.dispatch(fetchSavingsDetail('hantu'))

    expect(state(store).detail).toBeNull()
    expect(state(store).detailStatus).toBe('failed')
    expect(state(store).error).toBe('savings goal not found')
  })

  it('clearSavingsDetail mengembalikan detail ke keadaan awal', async () => {
    api.get.mockResolvedValueOnce({ data: { goal: { id: 's1' }, entries: [] } })
    const store = makeStore()
    await store.dispatch(fetchSavingsDetail('s1'))
    expect(state(store).detail).not.toBeNull()

    store.dispatch(clearSavingsDetail())

    expect(state(store).detail).toBeNull()
    expect(state(store).detailStatus).toBe('idle')
  })
})

describe('setor & tarik', () => {
  it('depositSavings POST ke /savings/:id/deposit tanpa menyertakan id di body', async () => {
    api.post.mockResolvedValue({ data: { id: 'e1' } })

    const store = makeStore()
    await store.dispatch(depositSavings({ id: 's1', amount: 250000, note: 'gajian' }))

    expect(api.post).toHaveBeenCalledWith('/savings/s1/deposit', {
      amount: 250000,
      note: 'gajian',
    })
  })

  it('withdrawSavings POST ke /savings/:id/withdraw', async () => {
    api.post.mockResolvedValue({ data: { id: 'e2' } })

    const store = makeStore()
    await store.dispatch(withdrawSavings({ id: 's1', amount: 50000 }))

    expect(api.post).toHaveBeenCalledWith('/savings/s1/withdraw', { amount: 50000 })
  })

  it('sukses setor TIDAK mengubah items — komponen yang refetch', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [{ id: 's1', saved_amount: 0 }] } })
    const store = makeStore()
    await store.dispatch(fetchSavings())

    api.post.mockResolvedValueOnce({ data: { id: 'e1' } })
    await store.dispatch(depositSavings({ id: 's1', amount: 250000 }))

    expect(state(store).items).toEqual([{ id: 's1', saved_amount: 0 }])
    expect(state(store).status).toBe('succeeded')
  })

  it('penarikan melebihi saldo menyimpan pesan backend apa adanya', async () => {
    api.post.mockRejectedValue(backendError('withdrawal exceeds savings balance'))

    const store = makeStore()
    await store.dispatch(withdrawSavings({ id: 's1', amount: 999999999 }))

    expect(state(store).error).toBe('withdrawal exceeds savings balance')
  })
})

describe('create / update / delete', () => {
  it('createSavings POST body apa adanya', async () => {
    api.post.mockResolvedValue({ data: { id: 's9' } })

    const store = makeStore()
    await store.dispatch(
      createSavings({ name: 'Dana Darurat', target_amount: 20000000, target_date: '2027-06-30' })
    )

    expect(api.post).toHaveBeenCalledWith('/savings', {
      name: 'Dana Darurat',
      target_amount: 20000000,
      target_date: '2027-06-30',
    })
  })

  it('updateSavings PUT ke /savings/:id dengan id dikeluarkan dari body', async () => {
    api.put.mockResolvedValue({ data: { id: 's1' } })

    const store = makeStore()
    await store.dispatch(updateSavings({ id: 's1', name: 'Dana Darurat', status: 'archived' }))

    expect(api.put).toHaveBeenCalledWith('/savings/s1', {
      name: 'Dana Darurat',
      status: 'archived',
    })
  })

  it('deleteSavings yang ditolak karena masih bersaldo menyimpan pesan backend', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [{ id: 's1' }, { id: 's2' }] } })
    const store = makeStore()
    await store.dispatch(fetchSavings())

    api.delete.mockRejectedValueOnce(
      backendError('withdraw the remaining balance before deleting this savings goal')
    )
    await store.dispatch(deleteSavings('s1'))

    expect(api.delete).toHaveBeenCalledWith('/savings/s1')
    // Item lokal tidak dibuang — daftar baru berubah setelah refetch.
    expect(state(store).items).toHaveLength(2)
    expect(state(store).error).toBe(
      'withdraw the remaining balance before deleting this savings goal'
    )
  })

  it('deleteSavingsEntry memanggil endpoint mutasi yang bersarang', async () => {
    api.delete.mockResolvedValue({})

    const store = makeStore()
    await store.dispatch(deleteSavingsEntry({ id: 's1', entryId: 'e1' }))

    expect(api.delete).toHaveBeenCalledWith('/savings/s1/entries/e1')
  })

  it('clearSavingsError menghapus error', async () => {
    api.post.mockRejectedValueOnce(backendError('boom'))
    const store = makeStore()
    await store.dispatch(createSavings({}))
    expect(state(store).error).toBe('boom')

    store.dispatch(clearSavingsError())

    expect(state(store).error).toBeNull()
  })
})
