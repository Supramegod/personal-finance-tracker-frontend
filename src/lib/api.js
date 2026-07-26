import axios from 'axios'

/**
 * Axios instance for API communication
 * Base URL dapat diubah via environment variable VITE_API_BASE_URL
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Logging global untuk debugging integrasi. Lihat Console browser.
// Prefix [API] biar gampang difilter. Hapus/log level turunkan saat produksi.
console.log('[API] baseURL =', api.defaults.baseURL)

/**
 * Request interceptor — attach Bearer token
 */
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log('[API →]', (config.method || 'get').toUpperCase(), (config.baseURL || '') + config.url, config.params || '')
    return config
  },
  (error) => {
    console.error('[API ✗ request]', error.message)
    return Promise.reject(error)
  }
)

/**
 * Response interceptor — handle 401, parse error
 */
api.interceptors.response.use(
  (response) => {
    console.log('[API ←]', response.status, response.config.url)
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Log detail error apa pun. Kalau tidak ada error.response, biasanya
    // CORS terblokir atau server tidak terjangkau (Network Error).
    console.error('[API ✗]', {
      url: originalRequest?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      hint: error.response ? undefined : 'Tidak ada response — kemungkinan CORS diblokir atau server tak terjangkau',
    })

    // Handle 401 — token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const stored = sessionStorage.getItem('refresh_token')
      if (!stored) {
        sessionStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        // Beberapa request bisa 401 bersamaan. Refresh token itu SEKALI-PAKAI
        // (backend me-rotasi), jadi semua request berbagi SATU promise refresh —
        // kalau tiap request refresh sendiri-sendiri, rotasi kedua dst gagal.
        const newAccessToken = await refreshOnce()
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch {
        sessionStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  }
)

// refreshOnce memastikan hanya ada satu request /auth/refresh yang berjalan pada
// satu waktu; pemanggil yang bersamaan menunggu promise yang sama.
let refreshPromise = null
function refreshOnce() {
  if (!refreshPromise) {
    const stored = sessionStorage.getItem('refresh_token')
    refreshPromise = axios
      .post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: stored })
      .then((res) => {
        const { access_token, refresh_token } = res.data
        sessionStorage.setItem('access_token', access_token)
        sessionStorage.setItem('refresh_token', refresh_token)
        return access_token
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

export default api
