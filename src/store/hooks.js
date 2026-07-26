import { useDispatch, useSelector } from 'react-redux'

/**
 * Typed Redux hooks
 * Gunakan ini di seluruh komponen, jangan pake useDispatch/useSelector langsung
 */

export const useAppDispatch = () => useDispatch()
export const useAppSelector = useSelector
