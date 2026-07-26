import { useState, useEffect, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  fetchCalendar,
  fetchDayTransactions,
  setSelectedDate,
  clearDayTransactions,
} from '@/store/slices/calendarSlice'
import DayTransactionPopup from './DayTransactionPopup'
import { cn, toISODate, toISOMonth } from '@/lib/utils'

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function getDayOfWeek(year, month, day) {
  return new Date(year, month - 1, day).getDay()
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

export default function CalendarView() {
  const dispatch = useAppDispatch()
  const { days, status, error, selectedDate } = useAppSelector((state) => state.calendar)

  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(() => toISOMonth(today))
  const [showPopup, setShowPopup] = useState(false)

  const [year, month] = currentMonth.split('-').map(Number)
  const monthLabel = `${MONTH_NAMES[month - 1]} ${year}`
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfWeek = getDayOfWeek(year, month, 1)

  const daysWithTx = new Set(days.map((d) => d.date))
  const todayStr = toISODate(today)

  useEffect(() => {
    dispatch(fetchCalendar(currentMonth))
  }, [dispatch, currentMonth])

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(toISOMonth(new Date(year, month - 2, 1)))
  }, [year, month])

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(toISOMonth(new Date(year, month, 1)))
  }, [year, month])

  const handleDayClick = useCallback((day) => {
    const dateStr = toISODate(new Date(year, month - 1, day))
    dispatch(setSelectedDate(dateStr))
    dispatch(fetchDayTransactions(dateStr))
    setShowPopup(true)
  }, [dispatch, year, month])

  const handleClosePopup = useCallback(() => {
    setShowPopup(false)
    dispatch(clearDayTransactions())
  }, [dispatch])

  const handleRetry = useCallback(() => {
    dispatch(fetchCalendar(currentMonth))
  }, [dispatch, currentMonth])

  // Generate calendar grid cells
  const cells = []
  // Empty cells before first day
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`empty-${i}`} className="h-10" />)
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = toISODate(new Date(year, month - 1, day))
    const isToday = dateStr === todayStr
    const hasTx = daysWithTx.has(dateStr)

    cells.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        className={cn(
          'relative h-10 rounded-lg text-sm font-medium transition-colors flex flex-col items-center justify-center',
          'hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          isToday
            ? 'bg-primary text-white hover:bg-primary/90'
            : 'text-text hover:text-primary'
        )}
      >
        <span>{day}</span>
        {hasTx && (
          <span
            className={cn(
              'absolute -bottom-0.5 w-1 h-1 rounded-full',
              isToday ? 'bg-white' : 'bg-primary'
            )}
          />
        )}
      </button>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-brand-50 transition-colors"
            aria-label="Bulan sebelumnya"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h3 className="text-base font-semibold text-text">
            {monthLabel}
          </h3>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-brand-50 transition-colors"
            aria-label="Bulan berikutnya"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Loading Skeleton */}
        {status === 'loading' ? (
          <div className="space-y-2">
            {/* Day name header skeleton */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_NAMES.map((_, i) => (
                <div key={i} className="skeleton h-4 w-full" />
              ))}
            </div>
            {/* Row skeletons */}
            {[...Array(5)].map((_, row) => (
              <div key={row} className="grid grid-cols-7 gap-1">
                {[...Array(7)].map((_, col) => (
                  <div key={col} className="skeleton h-10 w-full" />
                ))}
              </div>
            ))}
          </div>
        ) : status === 'failed' ? (
          /* Error state — jangan tampilkan grid kosong seolah-olah berhasil */
          <div className="text-center py-8 text-gray-500">
            <svg className="w-10 h-10 mx-auto mb-2 text-expense" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-sm font-medium text-text">Gagal memuat kalender</p>
            <p className="text-xs text-gray-400 mt-1">{error}</p>
            <button
              onClick={handleRetry}
              className="mt-3 py-1.5 px-4 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <>
            {/* Day name header */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_NAMES.map((name) => (
                <div
                  key={name}
                  className="h-8 flex items-center justify-center text-xs font-medium text-gray-400 uppercase tracking-wider"
                >
                  {name}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {cells}
            </div>

            {/* Info: bulan ini belum ada transaksi (grid tetap bisa diklik) */}
            {days.length === 0 && status === 'succeeded' && (
              <p className="mt-3 text-center text-xs text-gray-400">
                Belum ada transaksi bulan ini
              </p>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Ada transaksi
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3 h-3 rounded-full bg-primary text-white flex items-center justify-center text-[8px] font-bold">T</span>
                Hari ini
              </div>
            </div>
          </>
        )}
      </div>

      {/* Popup transaksi per tanggal */}
      {showPopup && selectedDate && (
        <DayTransactionPopup
          date={selectedDate}
          onClose={handleClosePopup}
          onRetry={() => dispatch(fetchDayTransactions(selectedDate))}
        />
      )}
    </>
  )
}
