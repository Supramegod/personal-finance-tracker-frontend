import { Navigate, Outlet } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'

export default function ProtectedRoute() {
  const { isAuthenticated, authChecked } = useAppSelector((state) => state.auth)

  // Selama silent-refresh (bootstrap) belum selesai, jangan redirect ke login —
  // tampilkan loading. Tanpa ini, reload halaman selalu melempar ke login karena
  // isAuthenticated masih false saat refresh token masih berjalan.
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
