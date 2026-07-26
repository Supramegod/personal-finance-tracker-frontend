import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { refreshToken, markAuthChecked } from '@/store/slices/authSlice'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import PageShell from '@/components/layout/PageShell'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import TransactionPage from '@/pages/TransactionPage'
import InstallmentPage from '@/pages/InstallmentPage'
import ReportsPage from '@/pages/ReportsPage'
import MembersPage from '@/pages/MembersPage'

// Guard level-modul: refresh token itu sekali-pakai (backend me-rotasi token).
// React StrictMode di dev memanggil effect dua kali; tanpa guard ini, dua
// request refresh dengan token yang sama → yang kedua pakai token sudah dicabut
// → gagal → user ke-logout. Modul-level dijamin hanya jalan sekali.
let bootstrapStarted = false

export default function App() {
  const dispatch = useAppDispatch()
  const { isAuthenticated, status } = useAppSelector((state) => state.auth)

  // Silent refresh token saat app mount (hanya sekali per load).
  useEffect(() => {
    if (bootstrapStarted) return
    bootstrapStarted = true

    const refreshTokenValue = sessionStorage.getItem('refresh_token')
    if (refreshTokenValue) {
      dispatch(refreshToken())
    } else {
      // Tidak ada token untuk dicoba — bootstrap selesai, user belum login.
      dispatch(markAuthChecked())
    }
  }, [dispatch])

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route element={<PageShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionPage />} />
          <Route path="/installments" element={<InstallmentPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/members" element={<MembersPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
