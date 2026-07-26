import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from './store'
import App from './App'
import './index.css'

// Penangkap error global — tampilkan apa pun yang lolos dari komponen/Axios
// ke Console, biar tidak ada error yang "hilang" tanpa jejak.
window.addEventListener('error', (e) => {
  console.error('[GLOBAL error]', e.message, e.error)
})
window.addEventListener('unhandledrejection', (e) => {
  console.error('[GLOBAL unhandledrejection]', e.reason)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
)
