import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/api'

function apiError(err, fallback) {
  const e = err.response?.data?.error
  return (typeof e === 'string' ? e : e?.message) || err.message || fallback
}

/**
 * Fetch saldo terkini. Backend: { balance }.
 */
export const fetchBalance = createAsyncThunk(
  'balance/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/summary/balance')
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal memuat saldo'))
    }
  }
)

/**
 * Fetch report income vs expense per periode.
 * Backend WAJIB menerima from & to (YYYY-MM-DD); kalau kosong -> 400.
 * Response: { periods, total_income, total_expense, net }.
 */
export const fetchReport = createAsyncThunk(
  'balance/fetchReport',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/summary/report', { params })
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal memuat laporan'))
    }
  }
)

const initialState = {
  balance: 0,
  report: {
    total_income: 0,
    total_expense: 0,
    net: 0,
    periods: [],
  },
  status: 'idle',
  reportStatus: 'idle',
  error: null,
}

const balanceSlice = createSlice({
  name: 'balance',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Balance
      .addCase(fetchBalance.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.balance = action.payload.balance
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      // Report
      .addCase(fetchReport.pending, (state) => {
        state.reportStatus = 'loading'
      })
      .addCase(fetchReport.fulfilled, (state, action) => {
        state.reportStatus = 'succeeded'
        state.report = action.payload
      })
      .addCase(fetchReport.rejected, (state, action) => {
        state.reportStatus = 'failed'
        state.error = action.payload
      })
  },
})

export default balanceSlice.reducer
