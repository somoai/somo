/**
 * Typed Redux Hooks
 *
 * Use these hooks instead of plain useDispatch and useSelector
 * for full TypeScript support.
 */

import {useDispatch, useSelector, TypedUseSelectorHook} from 'react-redux';
import type {RootState, AppDispatch} from './index';

/**
 * Typed useDispatch hook
 *
 * @example
 * const dispatch = useAppDispatch();
 * dispatch(requestOTP(phoneNumber));
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed useSelector hook
 *
 * @example
 * const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
