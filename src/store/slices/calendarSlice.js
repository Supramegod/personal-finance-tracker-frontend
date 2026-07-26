import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/api'

function apiError(err, fallback) {
  const e = err.response?.data?.error
  return (typeof e === 'string' ? e : e?.message) || err.message || fallback
}

/**
 * Fetch data kalender per bulan. Backend: { data: [...] }.
 */
export const fetchCalendar = createAsyncThunk(
  'calendar/fetch',
  async (month, { rejectWithValue }) => {
    try {
      const res = await api.get('/transactions/calendar', { params: { month } })
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal memuat kalender'))
    }
  }
)

/**
 * Fetch transaksi untuk tanggal tertentu (filter from=to=tanggal).
 * Backend: { data: [...] }.
 */
export const fetchDayTransactions = createAsyncThunk(
  'calendar/fetchDayTransactions',
  async (date, { rejectWithValue }) => {
    try {
      const res = await api.get('/transactions', { params: { from: date, to: date } })
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal memuat transaksi'))
    }
  }
)

const initialState = {
  days: [],
  selectedDate: null,
  transactions: [],
  status: 'idle',
  transactionsStatus: 'idle',
  error: null,
  transactionsError: null,
}

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload
    },
    clearDayTransactions: (state) => {
      state.transactions = []
      state.selectedDate = null
      state.transactionsStatus = 'idle'
      state.transactionsError = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Calendar days
      .addCase(fetchCalendar.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchCalendar.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.days = action.payload.data ?? []
      })
      .addCase(fetchCalendar.rejected, (state, action) => {
        state.status = 'failed'
        state.days = []
        state.error = action.payload || 'Gagal memuat kalender'
      })
      // Day transactions
      .addCase(fetchDayTransactions.pending, (state) => {
        state.transactionsStatus = 'loading'
        state.transactionsError = null
      })
      .addCase(fetchDayTransactions.fulfilled, (state, action) => {
        state.transactionsStatus = 'succeeded'
        state.transactions = action.payload.data ?? []
      })
      .addCase(fetchDayTransactions.rejected, (state, action) => {
        state.transactionsStatus = 'failed'
        state.transactions = []
        state.transactionsError = action.payload || 'Gagal memuat transaksi'
      })
  },
})

export const { setSelectedDate, clearDayTransactions } = calendarSlice.actions
export default calendarSlice.reducer
