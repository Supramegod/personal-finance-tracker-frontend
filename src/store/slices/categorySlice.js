import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/api'

function apiError(err, fallback) {
  const e = err.response?.data?.error
  return (typeof e === 'string' ? e : e?.message) || err.message || fallback
}

/**
 * Fetch all categories. Backend mengembalikan { data: [...] }.
 */
export const fetchCategories = createAsyncThunk(
  'categories/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/categories', { params })
      return res.data.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal memuat kategori'))
    }
  }
)

const initialState = {
  items: [],
  status: 'idle',
  error: null,
}

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export default categorySlice.reducer
