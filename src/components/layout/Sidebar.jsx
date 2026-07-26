import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logout, switchGroup, fetchGroups } from '@/store/slices/authSlice'
import { createGroup } from '@/store/slices/groupSlice'
import { cn } from '@/lib/utils'

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/transactions',
    label: 'Transaksi',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    to: '/installments',
    label: 'Cicilan',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    to: '/reports',
    label: 'Laporan',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: '/members',
    label: 'Kelola Anggota',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-4a4 4 0 100-8 4 4 0 000 8zm6 4a4 4 0 100-8 4 4 0 000 8zm-12 0a4 4 0 100-8 4 4 0 000 8z" />
      </svg>
    ),
    ownerOnly: true,
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [groupMenuOpen, setGroupMenuOpen] = useState(false)
  const [createGroupOpen, setCreateGroupOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [switching, setSwitching] = useState(false)
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [groupError, setGroupError] = useState('')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, groups, activeGroupId } = useAppSelector((state) => state.auth)

  const isOwner = groups.some((g) => g.role === 'owner')
  const activeGroup = groups.find((g) => g.id === activeGroupId)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const handleSwitchGroup = async (groupId) => {
    if (groupId === activeGroupId) {
      setGroupMenuOpen(false)
      return
    }
    setSwitching(true)
    try {
      await dispatch(switchGroup(groupId)).unwrap()
      window.location.reload()
    } catch (err) {
      setGroupError(err || 'Gagal berganti kelompok')
      setSwitching(false)
    }
  }

  const handleCreateGroup = async (ev) => {
    ev.preventDefault()
    if (!newGroupName.trim()) return
    setCreatingGroup(true)
    setGroupError('')
    try {
      await dispatch(createGroup({ name: newGroupName.trim() })).unwrap()
      await dispatch(fetchGroups())
      setCreateGroupOpen(false)
      setNewGroupName('')
      setGroupMenuOpen(false)
    } catch (err) {
      setGroupError(err || 'Gagal membuat kelompok')
    } finally {
      setCreatingGroup(false)
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-30 h-screen',
          'bg-white border-r border-gray-200',
          'flex flex-col transition-all duration-300',
          collapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-64'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex items-center h-16 px-4 border-b border-gray-200',
          collapsed && 'lg:justify-center lg:px-0'
        )}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">PF</span>
          </div>
          {!collapsed && (
            <span className="ml-3 font-semibold text-text text-sm lg:block">
              Personal Finance
            </span>
          )}
        </div>

        {/* Ganti kelompok aktif */}
        <div className={cn('relative px-2 pt-3', collapsed && 'lg:px-1')}>
          <button
            onClick={() => setGroupMenuOpen((o) => !o)}
            disabled={switching}
            className={cn(
              'flex items-center w-full gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-left disabled:opacity-50',
              collapsed && 'lg:justify-center lg:px-0'
            )}
          >
            <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-4a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
            {!collapsed && (
              <span className="flex-1 min-w-0">
                <span className="block text-xs text-gray-400">Kelompok Aktif</span>
                <span className="block text-sm font-medium text-text truncate">
                  {switching ? 'Berpindah...' : activeGroup?.name || '—'}
                </span>
              </span>
            )}
            {!collapsed && (
              <svg className={cn('w-4 h-4 text-gray-400 transition-transform flex-shrink-0', groupMenuOpen && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          {groupMenuOpen && !collapsed && (
            <div className="absolute left-2 right-2 mt-1 z-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-64 overflow-y-auto">
              {groupError && (
                <p className="px-3 py-1.5 text-xs text-expense">{groupError}</p>
              )}
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleSwitchGroup(g.id)}
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors',
                    g.id === activeGroupId ? 'text-primary font-medium' : 'text-gray-700'
                  )}
                >
                  <span className="truncate">{g.name}</span>
                  {g.id === activeGroupId && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    setCreateGroupOpen(true)
                    setGroupError('')
                  }}
                  className="flex items-center w-full px-3 py-2 text-sm text-primary hover:bg-gray-50 transition-colors font-medium"
                >
                  ＋ Buat Kelompok
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.filter((item) => !item.ownerOnly || isOwner).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setCollapsed(true)}
              className={({ isActive }) => cn(
                'flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                collapsed && 'lg:justify-center lg:px-0',
                isActive
                  ? 'bg-primary-light text-primary'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="ml-3 lg:block">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info & logout */}
        <div className={cn(
          'p-4 border-t border-gray-200',
          collapsed && 'lg:px-2'
        )}>
          {!collapsed && (
            <div className="mb-3">
              <p className="text-sm font-medium text-text truncate">
                {user?.full_name || user?.email || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || ''}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={cn(
              'flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-red-50 hover:text-expense transition-colors',
              collapsed && 'lg:justify-center lg:px-0'
            )}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!collapsed && <span className="ml-3 lg:block">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Toggle button for mobile */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2 bg-white rounded-lg shadow-md border border-gray-200"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Modal buat kelompok baru */}
      {createGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !creatingGroup && setCreateGroupOpen(false)}
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
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="mis. Keluarga Budi"
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setCreateGroupOpen(false)}
                  disabled={creatingGroup}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingGroup}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-sm font-semibold text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {creatingGroup ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
