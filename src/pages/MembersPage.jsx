import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchManagedUsers,
  createUser,
  createGroup,
  fetchMembers,
  addMember,
  removeMember,
  moveMember,
} from '@/store/slices/groupSlice'
import { fetchGroups } from '@/store/slices/authSlice'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { cn } from '@/lib/utils'

export default function MembersPage() {
  const dispatch = useAppDispatch()
  const { groups } = useAppSelector((state) => state.auth)
  const { managedUsers, membersByGroup } = useAppSelector((state) => state.groups)

  const isOwner = groups.some((g) => g.role === 'owner')
  const ownedGroups = groups.filter((g) => g.role === 'owner')

  const [toast, setToast] = useState(null)
  const [dragOverGroup, setDragOverGroup] = useState(null)
  const [dragOverPool, setDragOverPool] = useState(false)

  const [userFormOpen, setUserFormOpen] = useState(false)
  const [userForm, setUserForm] = useState({ email: '', password: '', full_name: '' })
  const [userErrors, setUserErrors] = useState({})
  const [savingUser, setSavingUser] = useState(false)

  const [groupFormOpen, setGroupFormOpen] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [savingGroup, setSavingGroup] = useState(false)
  const [groupError, setGroupError] = useState('')

  const [removeTarget, setRemoveTarget] = useState(null) // { groupId, member }
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    if (!isOwner) return
    dispatch(fetchManagedUsers())
    ownedGroups.forEach((g) => dispatch(fetchMembers(g.id)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isOwner, groups.length])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  if (!isOwner) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-text">Kelola Anggota</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-sm text-gray-500">
          Hanya owner yang bisa mengelola anggota.
        </div>
      </div>
    )
  }

  // Set userId yang sudah jadi anggota di kelompok manapun (untuk sembunyikan dari kolam bila mau,
  // tapi biarkan tetap muncul karena satu user bisa ada di banyak kelompok).
  const membersOf = (groupId) => membersByGroup[groupId] || []

  const handleDropOnGroup = async (ev, targetGroupId) => {
    ev.preventDefault()
    setDragOverGroup(null)
    const userId = ev.dataTransfer.getData('userId')
    const fromGroupId = ev.dataTransfer.getData('fromGroupId')
    if (!userId) return

    if (fromGroupId === targetGroupId) return // drop ke kolom yang sama, abaikan

    try {
      if (!fromGroupId) {
        // dari kolam user
        await dispatch(addMember({ groupId: targetGroupId, userId })).unwrap()
        await dispatch(fetchMembers(targetGroupId))
        setToast({ type: 'success', message: 'Anggota ditambahkan' })
      } else {
        await dispatch(moveMember({ fromGroupId, toGroupId: targetGroupId, userId })).unwrap()
        await Promise.all([dispatch(fetchMembers(fromGroupId)), dispatch(fetchMembers(targetGroupId))])
        setToast({ type: 'success', message: 'Anggota dipindahkan' })
      }
    } catch (err) {
      setToast({ type: 'error', message: err || 'Gagal memproses anggota' })
    }
  }

  const handleDropOnPool = async (ev) => {
    ev.preventDefault()
    setDragOverPool(false)
    // Kolam user bukan target valid untuk drop (user tidak dihapus dari kelompok
    // dengan drag ke kolam) — abaikan sesuai spesifikasi drop hanya berlaku pada kolom kelompok.
  }

  const handleCreateUser = async (ev) => {
    ev.preventDefault()
    const errs = {}
    if (!userForm.email.trim()) errs.email = 'Email harus diisi'
    if (!userForm.password || userForm.password.length < 6) errs.password = 'Password minimal 6 karakter'
    if (!userForm.full_name.trim()) errs.full_name = 'Nama harus diisi'
    setUserErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSavingUser(true)
    try {
      await dispatch(createUser(userForm)).unwrap()
      await dispatch(fetchManagedUsers())
      setUserFormOpen(false)
      setUserForm({ email: '', password: '', full_name: '' })
      setToast({ type: 'success', message: 'User baru dibuat' })
    } catch (err) {
      setUserErrors({ submit: err || 'Gagal membuat user' })
    } finally {
      setSavingUser(false)
    }
  }

  const handleCreateGroup = async (ev) => {
    ev.preventDefault()
    if (!groupName.trim()) return
    setSavingGroup(true)
    setGroupError('')
    try {
      await dispatch(createGroup({ name: groupName.trim() })).unwrap()
      await dispatch(fetchGroups())
      setGroupFormOpen(false)
      setGroupName('')
      setToast({ type: 'success', message: 'Kelompok baru dibuat' })
    } catch (err) {
      setGroupError(err || 'Gagal membuat kelompok')
    } finally {
      setSavingGroup(false)
    }
  }

  const handleRemoveMember = async () => {
    if (!removeTarget) return
    setRemoving(true)
    try {
      await dispatch(removeMember({ groupId: removeTarget.groupId, userId: removeTarget.member.user_id })).unwrap()
      await dispatch(fetchMembers(removeTarget.groupId))
      setToast({ type: 'success', message: 'Anggota dihapus dari kelompok' })
      setRemoveTarget(null)
    } catch (err) {
      setToast({ type: 'error', message: err || 'Gagal menghapus anggota' })
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
          <span>Dashboard</span>
          <span>/</span>
          <span className="text-primary font-medium">Kelola Anggota</span>
        </div>
        <h1 className="text-2xl font-bold text-text">Kelola Anggota</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tarik kartu user untuk menambahkan atau memindahkan anggota antar kelompok.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 items-start">
        {/* Kolam User */}
        <div
          onDragOver={(ev) => {
            ev.preventDefault()
            setDragOverPool(true)
          }}
          onDragLeave={() => setDragOverPool(false)}
          onDrop={handleDropOnPool}
          className={cn(
            'bg-white rounded-xl border p-4 space-y-3',
            dragOverPool ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
          )}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text text-sm">Kolam User</h2>
            <button
              onClick={() => {
                setUserFormOpen(true)
                setUserErrors({})
              }}
              className="text-xs font-medium text-primary hover:underline"
            >
              + Buat User
            </button>
          </div>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {managedUsers.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-6">Belum ada user.</p>
            )}
            {managedUsers.map((u) => (
              <div
                key={u.id}
                draggable
                onDragStart={(ev) => {
                  ev.dataTransfer.setData('userId', u.id)
                  ev.dataTransfer.setData('fromGroupId', '')
                }}
                className="p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
              >
                <p className="text-sm font-medium text-text truncate">{u.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Kolom per kelompok */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {ownedGroups.map((g) => (
            <div
              key={g.id}
              onDragOver={(ev) => {
                ev.preventDefault()
                setDragOverGroup(g.id)
              }}
              onDragLeave={() => setDragOverGroup((cur) => (cur === g.id ? null : cur))}
              onDrop={(ev) => handleDropOnGroup(ev, g.id)}
              className={cn(
                'bg-white rounded-xl border p-4 space-y-3 min-h-[160px]',
                dragOverGroup === g.id ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200'
              )}
            >
              <h2 className="font-semibold text-text text-sm truncate">{g.name}</h2>
              <div className="space-y-2">
                {membersOf(g.id).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Belum ada anggota.</p>
                )}
                {membersOf(g.id).map((m) => (
                  <div
                    key={m.id}
                    draggable={m.role !== 'owner'}
                    onDragStart={(ev) => {
                      if (m.role === 'owner') {
                        ev.preventDefault()
                        return
                      }
                      ev.dataTransfer.setData('userId', m.user_id)
                      ev.dataTransfer.setData('fromGroupId', g.id)
                    }}
                    className={cn(
                      'flex items-center justify-between gap-2 p-3 rounded-lg border border-gray-200 bg-gray-50 transition-colors',
                      m.role !== 'owner' && 'cursor-grab active:cursor-grabbing hover:border-primary/50'
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {m.full_name}
                        {m.role === 'owner' && (
                          <span className="ml-1.5 text-[10px] font-semibold text-primary uppercase">Owner</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{m.email}</p>
                    </div>
                    {m.role !== 'owner' && (
                      <button
                        onClick={() => setRemoveTarget({ groupId: g.id, member: m })}
                        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-expense hover:bg-red-50 transition-colors"
                        title="Hapus dari kelompok"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Kartu buat kelompok baru */}
          <button
            onClick={() => {
              setGroupFormOpen(true)
              setGroupError('')
            }}
            className="min-h-[160px] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-primary hover:border-primary transition-colors"
          >
            <span className="text-2xl leading-none">＋</span>
            <span className="text-sm font-medium">Buat Kelompok</span>
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white',
            toast.type === 'success' ? 'bg-income' : 'bg-expense'
          )}
        >
          {toast.message}
        </div>
      )}

      {/* Modal buat user */}
      {userFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !savingUser && setUserFormOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-text mb-4">Buat User Baru</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              {userErrors.submit && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-expense">
                  {userErrors.submit}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                    userErrors.full_name ? 'border-expense' : 'border-gray-300'
                  )}
                />
                {userErrors.full_name && <p className="mt-1 text-xs text-expense">{userErrors.full_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                    userErrors.email ? 'border-expense' : 'border-gray-300'
                  )}
                />
                {userErrors.email && <p className="mt-1 text-xs text-expense">{userErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Password</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                    userErrors.password ? 'border-expense' : 'border-gray-300'
                  )}
                />
                {userErrors.password && <p className="mt-1 text-xs text-expense">{userErrors.password}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUserFormOpen(false)}
                  disabled={savingUser}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {savingUser ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal buat kelompok */}
      {groupFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !savingGroup && setGroupFormOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-text mb-4">Buat Kelompok Baru</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              {groupError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-expense">
                  {groupError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-text mb-1">Nama Kelompok</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setGroupFormOpen(false)}
                  disabled={savingGroup}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingGroup}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {savingGroup ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Konfirmasi hapus anggota */}
      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveMember}
        title="Hapus Anggota"
        message={`Hapus "${removeTarget?.member?.full_name}" dari kelompok ini?`}
        isLoading={removing}
      />
    </div>
  )
}
