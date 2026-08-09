import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import api from '@/lib/api'
import reducer, {
  clearInstallmentError,
  fetchInstallments,
  createInstallment,
  payInstallment,
  deleteInstallment,
} from '@/store/slices/installmentSlice'

const makeStore = () => configureStore({ reducer: { installments: reducer } })
const state = (store) => store.getState().installments
const backendError = (message) => ({ response: { data: { error: message } } })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchInstallments', () => {
  it('memakai res.data.data', async () => {
    api.get.mockResolvedValue({
      data: { data: [{ id: 'i1', name: 'Motor', monthly_amount: 500000 }] },
    })

    const store = makeStore()
    await store.dispatch(fetchInstallments())

    expect(api.get).toHaveBeenCalledWith('/installments')
    expect(state(store).items).toHaveLength(1)
    expect(state(store).status).toBe('succeeded')
  })

  it('memakai array kosong saat payload null', async () => {
    api.get.mockResolvedValue({ data: { data: null } })

    const store = makeStore()
    await store.dispatch(fetchInstallments())

    expect(state(store).items).toEqual([])
  })

  it('mengosongkan items saat gagal', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [{ id: 'i1' }] } })
    const store = makeStore()
    await store.dispatch(fetchInstallments())
    expect(state(store).items).toHaveLength(1)

    api.get.mockRejectedValueOnce(backendError('Gagal memuat cicilan'))
    await store.dispatch(fetchInstallments())

    expect(state(store).items).toEqual([])
    expect(state(store).status).toBe('failed')
  })
})

describe('payInstallment', () => {
  it('POST ke /installments/:id/pay tanpa body', async () => {
    api.post.mockResolvedValue({ data: { ok: true } })

    const store = makeStore()
    await store.dispatch(payInstallment('i1'))

    expect(api.post).toHaveBeenCalledWith('/installments/i1/pay')
  })

  it('sukses membayar TIDAK mengubah items maupun status — komponen yang refetch', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [{ id: 'i1', paid_count: 2 }] } })
    const store = makeStore()
    await store.dispatch(fetchInstallments())

    api.post.mockResolvedValueOnce({ data: { ok: true } })
    await store.dispatch(payInstallment('i1'))

    expect(state(store).items).toEqual([{ id: 'i1', paid_count: 2 }])
    expect(state(store).status).toBe('succeeded')
  })

  it('gagal membayar hanya mengisi error, status tetap', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [] } })
    const store = makeStore()
    await store.dispatch(fetchInstallments())

    api.post.mockRejectedValueOnce(backendError('Cicilan sudah lunas'))
    await store.dispatch(payInstallment('i1'))

    expect(state(store).error).toBe('Cicilan sudah lunas')
    expect(state(store).status).toBe('succeeded')
  })
})

describe('createInstallment & deleteInstallment', () => {
  it('createInstallment gagal menyimpan pesan error', async () => {
    api.post.mockRejectedValue(backendError('Tenor tidak valid'))

    const store = makeStore()
    await store.dispatch(createInstallment({ name: 'Motor', tenor: 0 }))

    expect(state(store).error).toBe('Tenor tidak valid')
  })

  it('deleteInstallment memanggil endpoint dan tidak membuang item lokal', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [{ id: 'i1' }, { id: 'i2' }] } })
    const store = makeStore()
    await store.dispatch(fetchInstallments())

    api.delete.mockResolvedValueOnce({})
    await store.dispatch(deleteInstallment('i1'))

    expect(api.delete).toHaveBeenCalledWith('/installments/i1')
    expect(state(store).items).toHaveLength(2)
  })

  it('clearInstallmentError menghapus error', async () => {
    api.post.mockRejectedValueOnce(backendError('boom'))
    const store = makeStore()
    await store.dispatch(createInstallment({}))
    expect(state(store).error).toBe('boom')

    store.dispatch(clearInstallmentError())

    expect(state(store).error).toBeNull()
  })
})
