import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/lib/api'

function apiError(err, fallback) {
  const e = err.response?.data?.error
  return (typeof e === 'string' ? e : e?.message) || err.message || fallback
}

/**
 * Ambil "kolam" user yang dikelola owner (semua user yang bisa
 * ditambahkan ke kelompok manapun milik owner ini).
 */
export const fetchManagedUsers = createAsyncThunk(
  'groups/fetchManagedUsers',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/users')
      return res.data.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal memuat daftar user'))
    }
  }
)

/**
 * Buat user baru (masuk ke kolam user owner).
 */
export const createUser = createAsyncThunk(
  'groups/createUser',
  async ({ email, password, full_name }, { rejectWithValue }) => {
    try {
      const res = await api.post('/users', { email, password, full_name })
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal membuat user'))
    }
  }
)

/**
 * Buat kelompok baru.
 */
export const createGroup = createAsyncThunk(
  'groups/createGroup',
  async ({ name }, { rejectWithValue }) => {
    try {
      const res = await api.post('/groups', { name })
      return res.data
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal membuat kelompok'))
    }
  }
)

/**
 * Ambil anggota suatu kelompok.
 */
export const fetchMembers = createAsyncThunk(
  'groups/fetchMembers',
  async (groupId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/groups/${groupId}/members`)
      return { groupId, members: res.data.data }
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal memuat anggota kelompok'))
    }
  }
)

/**
 * Tambah anggota ke kelompok (idempotent di backend).
 */
export const addMember = createAsyncThunk(
  'groups/addMember',
  async ({ groupId, userId, role }, { rejectWithValue }) => {
    try {
      await api.post(`/groups/${groupId}/members`, { user_id: userId, role: role || 'member' })
      return { groupId }
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal menambah anggota'))
    }
  }
)

/**
 * Hapus anggota dari kelompok.
 */
export const removeMember = createAsyncThunk(
  'groups/removeMember',
  async ({ groupId, userId }, { rejectWithValue }) => {
    try {
      await api.delete(`/groups/${groupId}/members/${userId}`)
      return { groupId }
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal menghapus anggota'))
    }
  }
)

/**
 * Pindahkan anggota dari satu kelompok ke kelompok lain — tambah ke
 * kelompok tujuan dulu, baru hapus dari kelompok asal (drag-and-drop
 * antar kolom kelompok).
 */
export const moveMember = createAsyncThunk(
  'groups/moveMember',
  async ({ fromGroupId, toGroupId, userId }, { rejectWithValue }) => {
    try {
      await api.post(`/groups/${toGroupId}/members`, { user_id: userId, role: 'member' })
      await api.delete(`/groups/${fromGroupId}/members/${userId}`)
      return { fromGroupId, toGroupId }
    } catch (err) {
      return rejectWithValue(apiError(err, 'Gagal memindahkan anggota'))
    }
  }
)

const initialState = {
  managedUsers: [],
  membersByGroup: {},
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
}

const groupSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    clearGroupError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch managed users
      .addCase(fetchManagedUsers.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchManagedUsers.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.managedUsers = action.payload
      })
      .addCase(fetchManagedUsers.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      // Create user
      .addCase(createUser.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(createUser.fulfilled, (state) => {
        state.status = 'succeeded'
      })
      .addCase(createUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      // Create group
      .addCase(createGroup.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(createGroup.fulfilled, (state) => {
        state.status = 'succeeded'
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      // Fetch members
      .addCase(fetchMembers.pending, (state) => {
        state.error = null
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.membersByGroup[action.payload.groupId] = action.payload.members
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.error = action.payload
      })
      // Add member
      .addCase(addMember.rejected, (state, action) => {
        state.error = action.payload
      })
      // Remove member
      .addCase(removeMember.rejected, (state, action) => {
        state.error = action.payload
      })
      // Move member
      .addCase(moveMember.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const { clearGroupError } = groupSlice.actions
export default groupSlice.reducer
