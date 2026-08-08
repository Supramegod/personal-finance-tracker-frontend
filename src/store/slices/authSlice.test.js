import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import api from '@/lib/api'
import reducer, {
  logout,
  clearError,
  markAuthChecked,
  loginUser,
  refreshToken,
  switchGroup,
  fetchGroups,
} from '@/store/slices/authSlice'

function makeStore() {
  return configureStore({ reducer: { auth: reducer } })
}

const state = (store) => store.getState().auth

const backendError = (message) => ({ response: { data: { error: message } } })

// Bentuk LoginResponse dari backend. Token sengaja nilai palsu.
const loginResponse = (over = {}) => ({
  data: {
    access_token: 'a1',
    refresh_token: 'r1',
    user: { id: 'u1', email: 'user@example.test' },
    groups: [{ id: 'g1', role: 'owner' }],
    active_group_id: 'g1',
    ...over,
  },
})

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('loginUser', () => {
  it('menyimpan kedua token ke sessionStorage dan menandai terautentikasi', async () => {
    api.post.mockResolvedValue(loginResponse())

    const store = makeStore()
    await store.dispatch(loginUser({ email: 'user@example.test', password: 'rahasia' }))

    expect(sessionStorage.getItem('access_token')).toBe('a1')
    expect(sessionStorage.getItem('refresh_token')).toBe('r1')
    expect(state(store).isAuthenticated).toBe(true)
    expect(state(store).authChecked).toBe(true)
    expect(state(store).activeGroupId).toBe('g1')
    expect(state(store).groups).toHaveLength(1)
  })

  it('membaca pesan error backend berbentuk string', async () => {
    api.post.mockRejectedValue(backendError('Email atau password salah'))

    const store = makeStore()
    await store.dispatch(loginUser({ email: 'x@example.test', password: 'salah' }))

    expect(state(store).error).toBe('Email atau password salah')
    expect(state(store).isAuthenticated).toBe(false)
    expect(sessionStorage.getItem('access_token')).toBeNull()
  })

  it('juga menangani bentuk error objek {error:{message}}', async () => {
    api.post.mockRejectedValue({ response: { data: { error: { message: 'Akun terkunci' } } } })

    const store = makeStore()
    await store.dispatch(loginUser({ email: 'x@example.test', password: 'y' }))

    expect(state(store).error).toBe('Akun terkunci')
  })

  it('memakai default [] saat backend tidak mengirim groups', async () => {
    api.post.mockResolvedValue(loginResponse({ groups: undefined, active_group_id: undefined }))

    const store = makeStore()
    await store.dispatch(loginUser({ email: 'a@example.test', password: 'b' }))

    expect(state(store).groups).toEqual([])
    expect(state(store).activeGroupId).toBeNull()
  })
})

describe('refreshToken — gerbang bootstrap', () => {
  it('menyimpan token hasil rotasi (token lama diganti, bukan dipertahankan)', async () => {
    sessionStorage.setItem('refresh_token', 'r-lama')
    api.post.mockResolvedValue(loginResponse({ access_token: 'a2', refresh_token: 'r2' }))

    const store = makeStore()
    await store.dispatch(refreshToken())

    expect(api.post).toHaveBeenCalledWith('/auth/refresh', { refresh_token: 'r-lama' })
    expect(sessionStorage.getItem('refresh_token')).toBe('r2')
    expect(state(store).isAuthenticated).toBe(true)
    expect(state(store).authChecked).toBe(true)
  })

  it('gagal tanpa refresh_token, tapi TETAP menyetel authChecked', async () => {
    const store = makeStore()
    await store.dispatch(refreshToken())

    // authChecked wajib true walau gagal — kalau tidak, ProtectedRoute
    // menggantung di spinner selamanya.
    expect(state(store).authChecked).toBe(true)
    expect(state(store).isAuthenticated).toBe(false)
    expect(api.post).not.toHaveBeenCalled()
  })

  it('membersihkan sessionStorage saat refresh ditolak backend', async () => {
    sessionStorage.setItem('access_token', 'a-basi')
    sessionStorage.setItem('refresh_token', 'r-dicabut')
    api.post.mockRejectedValue(backendError('token sudah dipakai'))

    const store = makeStore()
    await store.dispatch(refreshToken())

    expect(sessionStorage.getItem('access_token')).toBeNull()
    expect(sessionStorage.getItem('refresh_token')).toBeNull()
    expect(state(store).accessToken).toBeNull()
    expect(state(store).user).toBeNull()
    expect(state(store).authChecked).toBe(true)
  })
})

describe('switchGroup', () => {
  it('mengganti pasangan token dengan yang di-scope ke kelompok baru', async () => {
    sessionStorage.setItem('access_token', 'a1')
    sessionStorage.setItem('refresh_token', 'r1')
    api.post.mockResolvedValue(
      loginResponse({ access_token: 'a-g2', refresh_token: 'r-g2', active_group_id: 'g2' })
    )

    const store = makeStore()
    await store.dispatch(switchGroup('g2'))

    expect(api.post).toHaveBeenCalledWith('/auth/switch-group', { group_id: 'g2' })
    expect(sessionStorage.getItem('access_token')).toBe('a-g2')
    expect(state(store).activeGroupId).toBe('g2')
  })

  it('menyimpan pesan error saat gagal berganti kelompok', async () => {
    api.post.mockRejectedValue(backendError('Bukan anggota kelompok'))

    const store = makeStore()
    await store.dispatch(switchGroup('g-asing'))

    expect(state(store).error).toBe('Bukan anggota kelompok')
  })
})

describe('fetchGroups', () => {
  it('mengambil daftar dari response.data.data', async () => {
    api.get.mockResolvedValue({ data: { data: [{ id: 'g1', role: 'owner' }] } })

    const store = makeStore()
    await store.dispatch(fetchGroups())

    expect(state(store).groups).toEqual([{ id: 'g1', role: 'owner' }])
  })
})

describe('reducer sinkron', () => {
  it('logout mengosongkan state dan sessionStorage, dan menandai authChecked', async () => {
    api.post.mockResolvedValue(loginResponse())
    const store = makeStore()
    await store.dispatch(loginUser({ email: 'a@example.test', password: 'b' }))

    store.dispatch(logout())

    expect(state(store).isAuthenticated).toBe(false)
    expect(state(store).user).toBeNull()
    expect(state(store).authChecked).toBe(true)
    expect(sessionStorage.getItem('access_token')).toBeNull()
  })

  it('markAuthChecked menutup bootstrap tanpa mengautentikasi', () => {
    const next = reducer(undefined, markAuthChecked())

    expect(next.authChecked).toBe(true)
    expect(next.isAuthenticated).toBe(false)
  })

  it('clearError menghapus pesan error', () => {
    const withError = { ...reducer(undefined, { type: 'init' }), error: 'boom' }

    expect(reducer(withError, clearError()).error).toBeNull()
  })
})
