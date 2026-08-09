import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/api'

function apiError(err, fallback) {
  const e = err.response?.data?.error
  return (typeof e === 'string' ? e : e?.message) || err.message || fallback
}

/**
 * Fetch semua pot tabungan milik kelompok. Backend: { data: [...] } —
 * tiap item sudah membawa progres turunan (saved_amount, progress,
 * suggested_monthly, dst) yang dihitung di server.
 */
export const fetchSavings = createAsyncThunk(
  'savings/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/savings', { params })
      return res.data.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal memuat tabungan'))
    }
  }
)

/**
 * Fetch detail satu pot beserta riwayat mutasinya.
 * Backend: { goal, entries }.
 */
export const fetchSavingsDetail = createAsyncThunk(
  'savings/fetchDetail',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/savings/${id}`)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal memuat detail tabungan'))
    }
  }
)

/**
 * Buat pot tabungan baru. target_amount & target_date opsional.
 */
export const createSavings = createAsyncThunk(
  'savings/create',
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post('/savings', data)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal menambah tabungan'))
    }
  }
)

/**
 * Ubah pot tabungan (nama, target, tenggat, status).
 */
export const updateSavings = createAsyncThunk(
  'savings/update',
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/savings/${id}`, data)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal mengubah tabungan'))
    }
  }
)

/**
 * Hapus pot tabungan. Backend menolak (409) bila saldonya masih ada —
 * pesan errornya sudah user-facing, jadi diteruskan apa adanya.
 */
export const deleteSavings = createAsyncThunk(
  'savings/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/savings/${id}`)
      return { id }
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal menghapus tabungan'))
    }
  }
)

/**
 * Setor ke pot. Membuat transaksi bertanda transfer di backend, jadi
 * pemanggil wajib me-refetch saldo juga.
 */
export const depositSavings = createAsyncThunk(
  'savings/deposit',
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/savings/${id}/deposit`, data)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal menyetor tabungan'))
    }
  }
)

/**
 * Tarik dari pot. Ditolak (409) bila melebihi saldo pot.
 */
export const withdrawSavings = createAsyncThunk(
  'savings/withdraw',
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/savings/${id}/withdraw`, data)
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal menarik tabungan'))
    }
  }
)

/**
 * Batalkan satu mutasi. Ini satu-satunya cara membatalkan setoran —
 * transaksinya tidak bisa dihapus dari halaman Transaksi.
 */
export const deleteSavingsEntry = createAsyncThunk(
  'savings/deleteEntry',
  async ({ id, entryId }, { rejectWithValue }) => {
    try {
      await api.delete(`/savings/${id}/entries/${entryId}`)
      return { id, entryId }
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal membatalkan mutasi'))
    }
  }
)

const initialState = {
  items: [],
  detail: null, // { goal, entries }
  status: 'idle',
  detailStatus: 'idle',
  error: null,
}

const savingsSlice = createSlice({
  name: 'savings',
  initialState,
  reducers: {
    clearSavingsError(state) {
      state.error = null
    },
    clearSavingsDetail(state) {
      state.detail = null
      state.detailStatus = 'idle'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSavings.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchSavings.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload ?? []
      })
      .addCase(fetchSavings.rejected, (state, action) => {
        state.status = 'failed'
        state.items = []
        state.error = action.payload
      })
      // Detail
      .addCase(fetchSavingsDetail.pending, (state) => {
        state.detailStatus = 'loading'
        state.error = null
      })
      .addCase(fetchSavingsDetail.fulfilled, (state, action) => {
        state.detailStatus = 'succeeded'
        state.detail = action.payload
      })
      .addCase(fetchSavingsDetail.rejected, (state, action) => {
        state.detailStatus = 'failed'
        state.detail = null
        state.error = action.payload
      })
      // Mutasi (create/update/delete/deposit/withdraw): komponen me-refetch
      // setelah sukses, jadi di sini cukup menampung error.
      .addCase(createSavings.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(updateSavings.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(deleteSavings.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(depositSavings.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(withdrawSavings.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(deleteSavingsEntry.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const { clearSavingsError, clearSavingsDetail } = savingsSlice.actions
export default savingsSlice.reducer
