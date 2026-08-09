import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/api'

function apiError(err, fallback) {
  const e = err.response?.data?.error
  return (typeof e === 'string' ? e : e?.message) || err.message || fallback
}

/**
 * Fetch saldo terkini.
 * Backend: { balance, savings_total, net_worth }.
 *   balance      — saldo kas, SUDAH dikurangi setoran tabungan
 *   savings_total — total di seluruh pot tabungan
 *   net_worth    — kas + tabungan
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
 * Response: { periods, total_income, total_expense, total_savings, net }.
 * Baris transfer (mutasi tabungan) dikeluarkan dari income/expense dan
 * dijumlahkan terpisah sebagai total_savings, sehingga berlaku
 * net = total_income - total_expense - total_savings.
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
  savingsTotal: 0,
  netWorth: 0,
  report: {
    total_income: 0,
    total_expense: 0,
    total_savings: 0,
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
        // Default 0 supaya UI tetap jalan bila backend belum diperbarui.
        state.savingsTotal = action.payload.savings_total ?? 0
        state.netWorth = action.payload.net_worth ?? action.payload.balance
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
