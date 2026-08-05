import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import transactionReducer from './slices/transactionSlice'
import categoryReducer from './slices/categorySlice'
import balanceReducer from './slices/balanceSlice'
import calendarReducer from './slices/calendarSlice'
import installmentReducer from './slices/installmentSlice'
import groupReducer from './slices/groupSlice'
import aiInsightReducer from './slices/aiInsightSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    transactions: transactionReducer,
    categories: categoryReducer,
    balance: balanceReducer,
    calendar: calendarReducer,
    installments: installmentReducer,
    groups: groupReducer,
    aiInsight: aiInsightReducer,
  },
  devTools: import.meta.env.DEV,
})
