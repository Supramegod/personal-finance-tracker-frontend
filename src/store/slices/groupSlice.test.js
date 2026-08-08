import { describe, it, expect, beforeEach, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import api from '@/lib/api'
import reducer, {
  clearGroupError,
  fetchManagedUsers,
  createUser,
  createGroup,
  fetchMembers,
  addMember,
  removeMember,
  moveMember,
} from '@/store/slices/groupSlice'

const makeStore = () => configureStore({ reducer: { groups: reducer } })
const state = (store) => store.getState().groups
const backendError = (message) => ({ response: { data: { error: message } } })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('fetchManagedUsers & createUser', () => {
  it('mengisi kolam user dari res.data.data', async () => {
    api.get.mockResolvedValue({
      data: { data: [{ id: 'u1', email: 'anggota@example.test', full_name: 'Anggota' }] },
    })

    const store = makeStore()
    await store.dispatch(fetchManagedUsers())

    expect(api.get).toHaveBeenCalledWith('/users')
    expect(state(store).managedUsers).toHaveLength(1)
    expect(state(store).status).toBe('succeeded')
  })

  it('createUser mengirim email, password, full_name', async () => {
    api.post.mockResolvedValue({ data: { id: 'u2' } })

    const store = makeStore()
    await store.dispatch(
      createUser({ email: 'baru@example.test', password: 'kata-sandi-palsu', full_name: 'Baru' })
    )

    expect(api.post).toHaveBeenCalledWith('/users', {
      email: 'baru@example.test',
      password: 'kata-sandi-palsu',
      full_name: 'Baru',
    })
    expect(state(store).status).toBe('succeeded')
  })

  it('createGroup gagal menyimpan pesan error dan status failed', async () => {
    api.post.mockRejectedValue(backendError('Nama kelompok sudah dipakai'))

    const store = makeStore()
    await store.dispatch(createGroup({ name: 'Keluarga' }))

    expect(state(store).status).toBe('failed')
    expect(state(store).error).toBe('Nama kelompok sudah dipakai')
  })
})

describe('fetchMembers', () => {
  it('menyimpan anggota ter-indeks per groupId', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [{ id: 'u1', role: 'owner' }] } })
    const store = makeStore()
    await store.dispatch(fetchMembers('g1'))

    api.get.mockResolvedValueOnce({ data: { data: [{ id: 'u2', role: 'member' }] } })
    await store.dispatch(fetchMembers('g2'))

    expect(api.get).toHaveBeenCalledWith('/groups/g1/members')
    expect(state(store).membersByGroup.g1).toHaveLength(1)
    expect(state(store).membersByGroup.g2).toHaveLength(1)
    expect(state(store).membersByGroup.g1[0].id).toBe('u1')
  })

  it('gagal memuat anggota tidak menghapus kelompok lain yang sudah termuat', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [{ id: 'u1' }] } })
    const store = makeStore()
    await store.dispatch(fetchMembers('g1'))

    api.get.mockRejectedValueOnce(backendError('Bukan pemilik kelompok'))
    await store.dispatch(fetchMembers('g2'))

    expect(state(store).error).toBe('Bukan pemilik kelompok')
    expect(state(store).membersByGroup.g1).toHaveLength(1)
    expect(state(store).membersByGroup.g2).toBeUndefined()
  })
})

describe('addMember & removeMember', () => {
  it('addMember memakai role "member" saat role tidak diberikan', async () => {
    api.post.mockResolvedValue({})

    const store = makeStore()
    await store.dispatch(addMember({ groupId: 'g1', userId: 'u1' }))

    expect(api.post).toHaveBeenCalledWith('/groups/g1/members', {
      user_id: 'u1',
      role: 'member',
    })
  })

  it('addMember menghormati role eksplisit', async () => {
    api.post.mockResolvedValue({})

    const store = makeStore()
    await store.dispatch(addMember({ groupId: 'g1', userId: 'u1', role: 'owner' }))

    expect(api.post).toHaveBeenCalledWith('/groups/g1/members', {
      user_id: 'u1',
      role: 'owner',
    })
  })

  it('removeMember memanggil endpoint dengan groupId dan userId', async () => {
    api.delete.mockResolvedValue({})

    const store = makeStore()
    await store.dispatch(removeMember({ groupId: 'g1', userId: 'u1' }))

    expect(api.delete).toHaveBeenCalledWith('/groups/g1/members/u1')
  })
})

describe('moveMember — urutan operasi menentukan keselamatan data', () => {
  it('menambah ke kelompok tujuan DULU, baru menghapus dari asal', async () => {
    const urutan = []
    api.post.mockImplementation(() => {
      urutan.push('post')
      return Promise.resolve({})
    })
    api.delete.mockImplementation(() => {
      urutan.push('delete')
      return Promise.resolve({})
    })

    const store = makeStore()
    await store.dispatch(moveMember({ fromGroupId: 'g1', toGroupId: 'g2', userId: 'u1' }))

    expect(urutan).toEqual(['post', 'delete'])
    expect(api.post).toHaveBeenCalledWith('/groups/g2/members', {
      user_id: 'u1',
      role: 'member',
    })
    expect(api.delete).toHaveBeenCalledWith('/groups/g1/members/u1')
  })

  it('kalau penambahan gagal, penghapusan TIDAK dijalankan — anggota tidak hilang', async () => {
    api.post.mockRejectedValue(backendError('Kelompok tujuan penuh'))
    api.delete.mockResolvedValue({})

    const store = makeStore()
    await store.dispatch(moveMember({ fromGroupId: 'g1', toGroupId: 'g2', userId: 'u1' }))

    expect(api.delete).not.toHaveBeenCalled()
    expect(state(store).error).toBe('Kelompok tujuan penuh')
  })
})

describe('clearGroupError', () => {
  it('menghapus pesan error', async () => {
    api.post.mockRejectedValueOnce(backendError('boom'))
    const store = makeStore()
    await store.dispatch(createGroup({ name: 'X' }))
    expect(state(store).error).toBe('boom')

    store.dispatch(clearGroupError())

    expect(state(store).error).toBeNull()
  })
})
