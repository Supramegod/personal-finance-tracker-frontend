import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api from '@/lib/api'

function apiError(err, fallback) {
  const value = err.response?.data?.error
  return (typeof value === 'string' ? value : value?.message) || err.message || fallback
}

export const fetchAIConsent = createAsyncThunk(
  'aiInsight/fetchConsent',
  async (groupId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/groups/${groupId}/ai-consent`)
      return response.data
    } catch (error) {
      return rejectWithValue(apiError(error, 'Gagal memuat persetujuan AI'))
    }
  }
)

export const updateAIConsent = createAsyncThunk(
  'aiInsight/updateConsent',
  async ({ groupId, enabled }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/groups/${groupId}/ai-consent`, { enabled })
      return response.data
    } catch (error) {
      return rejectWithValue(apiError(error, 'Gagal memperbarui persetujuan AI'))
    }
  }
)

export const fetchLatestAIInsight = createAsyncThunk(
  'aiInsight/fetchLatest',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/summary/ai-insights/latest')
      return response.data
    } catch (error) {
      return rejectWithValue(apiError(error, 'Gagal memuat insight terbaru'))
    }
  }
)

export const fetchMonthlyAIInsight = createAsyncThunk(
  'aiInsight/fetchMonth',
  async (month, { rejectWithValue }) => {
    try {
      const response = await api.get('/summary/ai-insights', { params: { month } })
      return response.data
    } catch (error) {
      return rejectWithValue(apiError(error, 'Gagal memuat insight bulanan'))
    }
  }
)

const initialState = {
  consent: null,
  consentStatus: 'idle',
  latest: null,
  latestStatus: 'idle',
  monthly: null,
  monthlyStatus: 'idle',
  error: null,
}

const aiInsightSlice = createSlice({
  name: 'aiInsight',
  initialState,
  reducers: {
    clearAIInsight(state) {
      Object.assign(state, initialState)
    },
    clearAIError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAIConsent.pending, (state) => {
        state.consentStatus = 'loading'
        state.error = null
      })
      .addCase(fetchAIConsent.fulfilled, (state, action) => {
        state.consentStatus = 'succeeded'
        state.consent = action.payload
      })
      .addCase(fetchAIConsent.rejected, (state, action) => {
        state.consentStatus = 'failed'
        state.error = action.payload
      })
      .addCase(updateAIConsent.pending, (state) => {
        state.consentStatus = 'loading'
        state.error = null
      })
      .addCase(updateAIConsent.fulfilled, (state, action) => {
        state.consentStatus = 'succeeded'
        state.consent = action.payload
        if (!action.payload.enabled) {
          state.latest = null
          state.monthly = null
        }
      })
      .addCase(updateAIConsent.rejected, (state, action) => {
        state.consentStatus = 'failed'
        state.error = action.payload
      })
      .addCase(fetchLatestAIInsight.pending, (state) => {
        state.latestStatus = 'loading'
      })
      .addCase(fetchLatestAIInsight.fulfilled, (state, action) => {
        state.latestStatus = 'succeeded'
        state.latest = action.payload
      })
      .addCase(fetchLatestAIInsight.rejected, (state, action) => {
        state.latestStatus = 'failed'
        state.error = action.payload
      })
      .addCase(fetchMonthlyAIInsight.pending, (state) => {
        state.monthlyStatus = 'loading'
      })
      .addCase(fetchMonthlyAIInsight.fulfilled, (state, action) => {
        state.monthlyStatus = 'succeeded'
        state.monthly = action.payload
      })
      .addCase(fetchMonthlyAIInsight.rejected, (state, action) => {
        state.monthlyStatus = 'failed'
        state.error = action.payload
      })
  },
})

export const { clearAIInsight, clearAIError } = aiInsightSlice.actions
export default aiInsightSlice.reducer
