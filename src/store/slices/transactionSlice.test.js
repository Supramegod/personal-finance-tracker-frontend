import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import api from '@/lib/api'
import reducer, {
  setFilters,
  resetFilters,
  setPage,
  clearTransactionError,
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/store/slices/transactionSlice'

function makeStore() {
  return configureStore({ reducer: { transactions: reducer } })
}

const state = (store) => store.getState().transactions

// Error backend berbentuk {"error": "pesan"} (string), bukan {error:{message}}.
const backendError = (message) => ({ response: { data: { error: message } } })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('reducer sinkron', () => {
  it('setFilters menggabungkan, bukan menimpa seluruh filter', () => {
    const next = reducer(undefined, setFilters({ type: 'expense' }))

    expect(next.filters.type).toBe('expense')
    expect(next.filters.category_id).toBe('')
    expect(next.filters.from).toBe('')
  })

  it('resetFilters mengembalikan seluruh filter ke default', () => {
    const dirty = reducer(undefined, setFilters({ type: 'income', from: '2026-06-01' }))
    const next = reducer(dirty, resetFilters())

    expect(next.filters).toEqual({
      type: 'all',
      category_id: '',
      from: '',
      to: '',
      search: '',
    })
  })

  it('setPage mengubah halaman aktif', () => {
    expect(reducer(undefined, setPage(3)).page).toBe(3)
  })

  it('clearTransactionError menghapus error tanpa menyentuh status', () => {
    const failed = { ...reducer(undefined, { type: 'init' }), error: 'boom', status: 'failed' }
    const next = reducer(failed, clearTransactionError())

    expect(next.error).toBeNull()
    expect(next.status).toBe('failed')
  })
})

describe('fetchTransactions', () => {
  it('memetakan data + metadata pagination dari response backend', async () => {
    api.get.mockResolvedValue({
      data: {
        data: [{ id: 't1', amount: 50000, type: 'expense', transaction_date: '2026-06-20' }],
        total: 1,
        page: 2,
        limit: 20,
      },
    })

    const store = makeStore()
    await store.dispatch(fetchTransactions({ page: 2 }))

    expect(api.get).toHaveBeenCalledWith('/transactions', { params: { page: 2 } })
    expect(state(store).status).toBe('succeeded')
    expect(state(store).items).toHaveLength(1)
    expect(state(store).total).toBe(1)
    expect(state(store).page).toBe(2)
    expect(state(store).limit).toBe(20)
    expect(state(store).error).toBeNull()
  })

  it('mengambil pesan error string dari backend', async () => {
    api.get.mockRejectedValue(backendError('Rentang tanggal tidak valid'))

    const store = makeStore()
    await store.dispatch(fetchTransactions())

    expect(state(store).status).toBe('failed')
    expect(state(store).error).toBe('Rentang tanggal tidak valid')
  })

  it('jatuh ke err.message saat tidak ada response (CORS / server mati)', async () => {
    api.get.mockRejectedValue(new Error('Network Error'))

    const store = makeStore()
    await store.dispatch(fetchTransactions())

    expect(state(store).error).toBe('Network Error')
  })

  it('membersihkan error lama saat request baru dimulai', async () => {
    api.get.mockRejectedValueOnce(backendError('gagal'))
    const store = makeStore()
    await store.dispatch(fetchTransactions())
    expect(state(store).error).toBe('gagal')

    api.get.mockResolvedValueOnce({ data: { data: [], total: 0, page: 1, limit: 20 } })
    await store.dispatch(fetchTransactions())

    expect(state(store).error).toBeNull()
  })
})

describe('mutasi (create / update / delete)', () => {
  it('createTransaction TIDAK menyisipkan item ke state — komponen yang refetch', async () => {
    api.post.mockResolvedValue({ data: { id: 't-baru', amount: 1000 } })

    const store = makeStore()
    await store.dispatch(createTransaction({ amount: 1000, type: 'expense' }))

    expect(state(store).status).toBe('succeeded')
    expect(state(store).items).toEqual([])
  })

  it('updateTransaction mengirim id di URL dan body terpisah', async () => {
    api.put.mockResolvedValue({ data: { id: 't1' } })

    const store = makeStore()
    await store.dispatch(updateTransaction({ id: 't1', data: { amount: 2000 } }))

    expect(api.put).toHaveBeenCalledWith('/transactions/t1', { amount: 2000 })
    expect(state(store).status).toBe('succeeded')
  })

  it('deleteTransaction TIDAK membuang item dari state', async () => {
    api.get.mockResolvedValue({
      data: { data: [{ id: 't1' }, { id: 't2' }], total: 2, page: 1, limit: 20 },
    })
    api.delete.mockResolvedValue({})

    const store = makeStore()
    await store.dispatch(fetchTransactions())
    await store.dispatch(deleteTransaction('t1'))

    expect(api.delete).toHaveBeenCalledWith('/transactions/t1')
    expect(state(store).items).toHaveLength(2)
  })

  it('meneruskan pesan error backend saat gagal menghapus', async () => {
    api.delete.mockRejectedValue(backendError('Transaksi tidak ditemukan'))

    const store = makeStore()
    await store.dispatch(deleteTransaction('t-hilang'))

    expect(state(store).status).toBe('failed')
    expect(state(store).error).toBe('Transaksi tidak ditemukan')
  })
})
