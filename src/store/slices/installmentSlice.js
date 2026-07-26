import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/api'

function apiError(err, fallback) {
  const e = err.response?.data?.error
  return (typeof e === 'string' ? e : e?.message) || err.message || fallback
}

/**
 * Fetch semua cicilan milik user. Backend: { data: [...] } (dengan progres).
 */
export const fetchInstallments = createAsyncThunk(
  'installments/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/installments')
      return res.data.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal memuat cicilan'))
    }
  }
)

/**
 * Buat cicilan baru
 */
export const createInstallment = createAsyncThunk(
  'installments/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/installments', data)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal menambah cicilan'))
    }
  }
)

/**
 * Bayar cicilan bulan ini (membuat transaksi expense di backend)
 */
export const payInstallment = createAsyncThunk(
  'installments/pay',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.post(`/installments/${id}/pay`)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal membayar cicilan'))
    }
  }
)

/**
 * Hapus cicilan (transaksi expense yang sudah tercatat tetap ada)
 */
export const deleteInstallment = createAsyncThunk(
  'installments/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/installments/${id}`)
      return { id }
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal menghapus cicilan'))
    }
  }
)

const initialState = {
  items: [],
  status: 'idle',
  error: null,
}

const installmentSlice = createSlice({
  name: 'installments',
  initialState,
  reducers: {
    clearInstallmentError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInstallments.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchInstallments.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload ?? []
      })
      .addCase(fetchInstallments.rejected, (state, action) => {
        state.status = 'failed'
        state.items = []
        state.error = action.payload
      })
      // create / pay / delete: komponen me-refetch setelah sukses, jadi di sini
      // cukup menampung error.
      .addCase(createInstallment.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(payInstallment.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(deleteInstallment.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const { clearInstallmentError } = installmentSlice.actions
export default installmentSlice.reducer
