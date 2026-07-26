import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginUser, clearError } from '@/store/slices/authSlice'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, status, error } = useAppSelector((state) => state.auth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [validationError, setValidationError] = useState('')

  // Redirect jika sudah login
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Bersihin error saat component mount
  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  const isLoading = status === 'loading'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setValidationError('')

    // Validasi
    if (!email.trim()) {
      setValidationError('Email harus diisi')
      return
    }
    if (!password.trim()) {
      setValidationError('Password harus diisi')
      return
    }

    dispatch(loginUser({ email: email.trim(), password }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light to-white p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
              <span className="text-white font-bold text-xl">PF</span>
            </div>
            <h1 className="text-xl font-bold text-text">
              Personal Finance Tracker
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Masuk untuk mengelola keuangan Anda
            </p>
          </div>

          {/* Error Message */}
          {(validationError || error) && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-expense">
              {validationError || error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                disabled={isLoading}
                className={cn(
                  'w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                  'disabled:bg-gray-50 disabled:text-gray-400',
                  'placeholder:text-gray-400'
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className={cn(
                  'w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                  'disabled:bg-gray-50 disabled:text-gray-400',
                  'placeholder:text-gray-400'
                )}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white',
                'bg-primary hover:bg-primary/90 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
