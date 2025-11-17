/**
 * Redux Store Configuration
 *
 * Configures Redux Toolkit store with:
 * - Redux Persist (save to AsyncStorage)
 * - Multiple slices (auth, student, learning, onboarding)
 * - TypeScript types
 */

import {configureStore, combineReducers} from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import reducers
import authReducer from './slices/authSlice';
import studentReducer from './slices/studentSlice';
import learningReducer from './slices/learningSlice';
import onboardingReducer from './slices/onboardingSlice';
import chatReducer from './slices/chatSlice';

// ============================================================================
// Redux Persist Configuration
// ============================================================================

const persistConfig = {
  key: 'root',
  version: 1,
  storage: AsyncStorage,
  whitelist: ['auth', 'student', 'onboarding', 'chat'], // Only persist these
  blacklist: ['learning'], // Don't persist (fetched on demand)
};

// ============================================================================
// Root Reducer
// ============================================================================

const rootReducer = combineReducers({
  auth: authReducer,
  student: studentReducer,
  learning: learningReducer,
  onboarding: onboardingReducer,
  chat: chatReducer,
});

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// ============================================================================
// Store Configuration
// ============================================================================

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types from redux-persist
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: __DEV__, // Enable Redux DevTools in development
});

// ============================================================================
// Persistor
// ============================================================================

export const persistor = persistStore(store);

// ============================================================================
// TypeScript Types
// ============================================================================

/**
 * Root state type
 *
 * @example
 * const mapState = (state: RootState) => ({
 *   isAuthenticated: state.auth.isAuthenticated,
 * });
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * App dispatch type
 *
 * @example
 * const dispatch: AppDispatch = useDispatch();
 * dispatch(requestOTP(phoneNumber));
 */
export type AppDispatch = typeof store.dispatch;
