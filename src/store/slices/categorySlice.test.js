import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import api from '@/lib/api'
import reducer, { fetchCategories } from '@/store/slices/categorySlice'

const makeStore = () => configureStore({ reducer: { categories: reducer } })
const state = (store) => store.getState().categories
const backendError = (message) => ({ response: { data: { error: message } } })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchCategories', () => {
  it('membuka satu lapis: memakai res.data.data, bukan res.data', async () => {
    api.get.mockResolvedValue({
      data: { data: [{ id: 'c1', name: 'Makan', type: 'expense' }] },
    })

    const store = makeStore()
    await store.dispatch(fetchCategories())

    expect(state(store).items).toEqual([{ id: 'c1', name: 'Makan', type: 'expense' }])
    expect(state(store).status).toBe('succeeded')
  })

  it('meneruskan params filter ke backend', async () => {
    api.get.mockResolvedValue({ data: { data: [] } })

    const store = makeStore()
    await store.dispatch(fetchCategories({ type: 'income' }))

    expect(api.get).toHaveBeenCalledWith('/categories', { params: { type: 'income' } })
  })

  it('memakai pesan error dari backend', async () => {
    api.get.mockRejectedValue(backendError('Kategori tidak dapat dimuat'))

    const store = makeStore()
    await store.dispatch(fetchCategories())

    expect(state(store).status).toBe('failed')
    expect(state(store).error).toBe('Kategori tidak dapat dimuat')
  })

  it('jatuh ke err.message saat tidak ada response (CORS / server mati)', async () => {
    // Sama dengan slice lain: kalau request tidak pernah dapat response,
    // penyebab aslinya ("Network Error") yang ditampilkan, bukan pesan
    // generik — ini yang membedakan "server mati" dari "backend menolak".
    api.get.mockRejectedValue(new Error('Network Error'))

    const store = makeStore()
    await store.dispatch(fetchCategories())

    expect(state(store).error).toBe('Network Error')
  })

  it('memakai pesan default saat error tidak punya response maupun message', async () => {
    api.get.mockRejectedValue({})

    const store = makeStore()
    await store.dispatch(fetchCategories())

    expect(state(store).error).toBe('Gagal memuat kategori')
  })

  it('menangani bentuk error objek {error:{message}}', async () => {
    api.get.mockRejectedValue({ response: { data: { error: { message: 'Akses ditolak' } } } })

    const store = makeStore()
    await store.dispatch(fetchCategories())

    expect(state(store).error).toBe('Akses ditolak')
  })

  it('membersihkan error saat request baru dimulai', async () => {
    api.get.mockRejectedValueOnce(backendError('gagal'))
    const store = makeStore()
    await store.dispatch(fetchCategories())
    expect(state(store).error).toBe('gagal')

    api.get.mockResolvedValueOnce({ data: { data: [] } })
    await store.dispatch(fetchCategories())

    expect(state(store).error).toBeNull()
  })
})
