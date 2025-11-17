/**
 * Authentication Redux Slice
 *
 * Manages authentication state including:
 * - OTP request and verification
 * - Student registration
 * - JWT token management
 * - Login/logout state
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import api from '@services/api';
import storage from '@services/storage';
import type {
  OTPResponse,
  OTPVerifyResponse,
  RegistrationData,
  RegistrationResponse,
  AuthTokens,
} from '@types/api';
import {APIError} from '@services/apiErrors';

/**
 * Auth state interface
 */
export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  phoneNumber: string | null;
  otpVerified: boolean;
  otpId: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Initial state
 */
const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  phoneNumber: null,
  otpVerified: false,
  otpId: null,
  loading: false,
  error: null,
};

/**
 * Helper to extract error message
 */
const getErrorMessage = (error: unknown): string => {
  if (error instanceof APIError) {
    return error.userMessage;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// ============================================================================
// Async Thunks
// ============================================================================

/**
 * Request OTP for phone verification
 */
export const requestOTP = createAsyncThunk(
  'auth/requestOTP',
  async (phoneNumber: string, {rejectWithValue}) => {
    try {
      const response = await api.requestOTP(phoneNumber);
      return {phoneNumber, ...response};
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Verify OTP code
 */
export interface VerifyOTPParams {
  phoneNumber: string;
  otpCode: string;
}

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({phoneNumber, otpCode}: VerifyOTPParams, {rejectWithValue}) => {
    try {
      const response = await api.verifyOTP(phoneNumber, otpCode);
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Register new student
 */
export const registerStudent = createAsyncThunk(
  'auth/register',
  async (data: RegistrationData, {rejectWithValue}) => {
    try {
      const response = await api.register(data);

      // Save tokens to storage
      await storage.saveTokens({
        access: response.tokens.access,
        refresh: response.tokens.refresh,
      });

      // Save student profile
      await storage.saveStudent(response.student);

      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Logout user
 */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, {rejectWithValue}) => {
    try {
      // Clear all app data
      await storage.clearAllAppData();
      return true;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ============================================================================
// Slice
// ============================================================================

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Clear error message
     */
    clearError: state => {
      state.error = null;
    },

    /**
     * Set tokens (for token refresh)
     */
    setTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.accessToken = action.payload.access;
      state.refreshToken = action.payload.refresh;
      state.isAuthenticated = true;
    },

    /**
     * Clear OTP verification state
     */
    clearOTPState: state => {
      state.otpVerified = false;
      state.otpId = null;
      state.phoneNumber = null;
    },
  },
  extraReducers: builder => {
    // ========================================================================
    // Request OTP
    // ========================================================================
    builder.addCase(requestOTP.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(requestOTP.fulfilled, (state, action) => {
      state.loading = false;
      state.phoneNumber = action.payload.phoneNumber;
      state.error = null;
    });
    builder.addCase(requestOTP.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Verify OTP
    // ========================================================================
    builder.addCase(verifyOTP.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(verifyOTP.fulfilled, (state, action) => {
      state.loading = false;
      state.otpVerified = true;
      state.error = null;

      if (action.payload.is_new_user) {
        // New user - needs to register
        state.otpId = action.payload.otp_id || null;
        state.isAuthenticated = false;
      } else {
        // Existing user - logged in
        state.isAuthenticated = true;
        state.accessToken = action.payload.tokens?.access || null;
        state.refreshToken = action.payload.tokens?.refresh || null;
      }
    });
    builder.addCase(verifyOTP.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      state.otpVerified = false;
    });

    // ========================================================================
    // Register Student
    // ========================================================================
    builder.addCase(registerStudent.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerStudent.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.accessToken = action.payload.tokens.access;
      state.refreshToken = action.payload.tokens.refresh;
      state.error = null;

      // Clear OTP data
      state.otpVerified = false;
      state.otpId = null;
    });
    builder.addCase(registerStudent.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Logout
    // ========================================================================
    builder.addCase(logoutUser.pending, state => {
      state.loading = true;
    });
    builder.addCase(logoutUser.fulfilled, () => {
      // Return to initial state
      return initialState;
    });
    builder.addCase(logoutUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const {clearError, setTokens, clearOTPState} = authSlice.actions;
export default authSlice.reducer;
