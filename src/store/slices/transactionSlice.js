import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/api'

function apiError(err, fallback) {
  const e = err.response?.data?.error
  return (typeof e === 'string' ? e : e?.message) || err.message || fallback
}

/**
 * Fetch transaksi dengan filter & pagination.
 * Backend mengembalikan { data, total, page, limit }.
 * Catatan: param `search` belum didukung backend — diabaikan di server.
 */
export const fetchTransactions = createAsyncThunk(
  'transactions/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/transactions', { params })
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal memuat transaksi'))
    }
  }
)

/**
 * Create transaksi baru
 */
export const createTransaction = createAsyncThunk(
  'transactions/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/transactions', data)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal menambah transaksi'))
    }
  }
)

/**
 * Update transaksi
 */
export const updateTransaction = createAsyncThunk(
  'transactions/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/transactions/${id}`, data)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal mengupdate transaksi'))
    }
  }
)

/**
 * Delete transaksi (soft delete)
 */
export const deleteTransaction = createAsyncThunk(
  'transactions/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/transactions/${id}`)
      return { id }
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal menghapus transaksi'))
    }
  }
)

const initialState = {
  items: [],
  total: 0,
  page: 1,
  limit: 20,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  filters: {
    type: 'all',
    category_id: '',
    from: '',
    to: '',
    search: '',
  },
}

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload }
    },
    resetFilters(state) {
      state.filters = { type: 'all', category_id: '', from: '', to: '', search: '' }
    },
    setPage(state, action) {
      state.page = action.payload
    },
    clearTransactionError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.data
        state.total = action.payload.total
        state.page = action.payload.page
        state.limit = action.payload.limit
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      // Create transaction
      .addCase(createTransaction.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(createTransaction.fulfilled, (state) => {
        state.status = 'succeeded'
        // Akan di-refresh oleh komponen
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      // Update transaction
      .addCase(updateTransaction.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(updateTransaction.fulfilled, (state) => {
        state.status = 'succeeded'
      })
      .addCase(updateTransaction.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      // Delete transaction
      .addCase(deleteTransaction.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(deleteTransaction.fulfilled, (state) => {
        state.status = 'succeeded'
      })
      .addCase(deleteTransaction.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { setFilters, resetFilters, setPage, clearTransactionError } = transactionSlice.actions
export default transactionSlice.reducer
