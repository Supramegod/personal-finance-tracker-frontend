import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/api'

/**
 * Ambil pesan error dari response backend.
 * Backend mengirim {"error": "pesan"} (string), bukan {error:{message}}.
 */
function parseApiError(err, fallback) {
  const e = err.response?.data?.error
  if (typeof e === 'string') return e
  if (e?.message) return e.message
  return err.message || fallback
}

/**
 * Login user
 */
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/login', { email, password })

      // Simpan token di sessionStorage untuk interceptor Axios
      sessionStorage.setItem('access_token', res.data.access_token)
      sessionStorage.setItem('refresh_token', res.data.refresh_token)

      return res.data
    } catch (err) {
      return rejectWithValue(parseApiError(err, 'Login gagal'))
    }
  }
)

/**
 * Refresh token — silent refresh saat app mount, agar tidak ke-logout
 * setiap reload (token hanya ada di sessionStorage + Redux).
 */
export const refreshToken = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const refreshTokenValue = sessionStorage.getItem('refresh_token')
      if (!refreshTokenValue) throw new Error('No refresh token')

      const res = await api.post('/auth/refresh', { refresh_token: refreshTokenValue })

      sessionStorage.setItem('access_token', res.data.access_token)
      sessionStorage.setItem('refresh_token', res.data.refresh_token)

      return res.data
    } catch (err) {
      sessionStorage.clear()
      return rejectWithValue('Sesi habis, silakan login ulang')
    }
  }
)

/**
 * Ganti kelompok aktif — backend mengembalikan LoginResponse baru dengan
 * token yang di-scope ke kelompok tersebut. Komponen akan reload halaman
 * setelah ini agar semua data ter-refetch dengan token scope baru.
 */
export const switchGroup = createAsyncThunk(
  'auth/switchGroup',
  async (groupId, { rejectWithValue }) => {
    try {
      const res = await api.post('/auth/switch-group', { group_id: groupId })

      sessionStorage.setItem('access_token', res.data.access_token)
      sessionStorage.setItem('refresh_token', res.data.refresh_token)

      return res.data
    } catch (err) {
      return rejectWithValue(parseApiError(err, 'Gagal berganti kelompok'))
    }
  }
)

/**
 * Ambil daftar kelompok milik user — dipakai setelah membuat kelompok baru
 * agar dropdown ganti kelompok ikut ter-update.
 */
export const fetchGroups = createAsyncThunk(
  'auth/fetchGroups',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/groups')
      return res.data.data
    } catch (err) {
      return rejectWithValue(parseApiError(err, 'Gagal memuat kelompok'))
    }
  }
)

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  groups: [],
  activeGroupId: null,
  isAuthenticated: false,
  // authChecked: apakah bootstrap (silent refresh saat load) sudah selesai.
  // Selama false, ProtectedRoute menampilkan loading, BUKAN redirect ke login —
  // supaya reload halaman tidak melempar user ke login sebelum refresh selesai.
  authChecked: false,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.authChecked = true
      state.status = 'idle'
      state.error = null
      sessionStorage.clear()
    },
    clearError(state) {
      state.error = null
    },
    // Dipanggil saat tidak ada refresh_token untuk dicoba — bootstrap langsung
    // dianggap selesai (user memang belum login).
    markAuthChecked(state) {
      state.authChecked = true
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.isAuthenticated = true
        state.authChecked = true
        state.user = action.payload.user
        state.accessToken = action.payload.access_token
        state.refreshToken = action.payload.refresh_token
        state.groups = action.payload.groups ?? []
        state.activeGroupId = action.payload.active_group_id ?? null
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || 'Login gagal'
      })
      // Refresh token
      .addCase(refreshToken.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.isAuthenticated = true
        state.authChecked = true
        state.user = action.payload.user
        state.accessToken = action.payload.access_token
        state.refreshToken = action.payload.refresh_token
        state.groups = action.payload.groups ?? []
        state.activeGroupId = action.payload.active_group_id ?? null
      })
      .addCase(refreshToken.rejected, (state) => {
        state.status = 'failed'
        state.isAuthenticated = false
        state.authChecked = true
        state.user = null
        state.accessToken = null
        state.refreshToken = null
      })
      // Switch group
      .addCase(switchGroup.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(switchGroup.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.accessToken = action.payload.access_token
        state.refreshToken = action.payload.refresh_token
        state.groups = action.payload.groups ?? []
        state.activeGroupId = action.payload.active_group_id ?? null
      })
      .addCase(switchGroup.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || 'Gagal berganti kelompok'
      })
      // Fetch groups
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.groups = action.payload
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.error = action.payload || 'Gagal memuat kelompok'
      })
  },
})

export const { logout, clearError, markAuthChecked } = authSlice.actions
// (switchGroup, fetchGroups sudah diekspor langsung sebagai thunk di atas)
export default authSlice.reducer
