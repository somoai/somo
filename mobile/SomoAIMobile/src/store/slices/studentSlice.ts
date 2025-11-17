/**
 * Student Redux Slice
 *
 * Manages student profile state including:
 * - Profile data
 * - Profile updates
 * - Avatar management
 */

import {createSlice, createAsyncThunk} from '@reduxjs/toolkit';
import api from '@services/api';
import storage from '@services/storage';
import type {Student} from '@types/api';
import {APIError} from '@services/apiErrors';

/**
 * Student state interface
 */
export interface StudentState {
  profile: Student | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

/**
 * Initial state
 */
const initialState: StudentState = {
  profile: null,
  loading: false,
  error: null,
  lastUpdated: null,
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
 * Fetch student profile
 */
export const fetchProfile = createAsyncThunk(
  'student/fetchProfile',
  async (_, {rejectWithValue}) => {
    try {
      const profile = await api.getProfile();
      await storage.saveStudent(profile);
      return profile;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Update student profile
 */
export const updateProfile = createAsyncThunk(
  'student/updateProfile',
  async (data: Partial<Student>, {rejectWithValue}) => {
    try {
      const updatedProfile = await api.updateProfile(data);
      await storage.saveStudent(updatedProfile);
      return updatedProfile;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Load profile from storage (offline)
 */
export const loadProfileFromStorage = createAsyncThunk(
  'student/loadFromStorage',
  async (_, {rejectWithValue}) => {
    try {
      const profile = await storage.getStudent();
      if (!profile) {
        throw new Error('No profile found in storage');
      }
      return profile;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ============================================================================
// Slice
// ============================================================================

const studentSlice = createSlice({
  name: 'student',
  initialState,
  reducers: {
    /**
     * Clear error message
     */
    clearError: state => {
      state.error = null;
    },

    /**
     * Set profile (for registration or login)
     */
    setProfile: (state, action) => {
      state.profile = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    /**
     * Clear profile (logout)
     */
    clearProfile: state => {
      state.profile = null;
      state.lastUpdated = null;
      state.error = null;
    },

    /**
     * Update profile locally (optimistic update)
     */
    updateProfileLocally: (state, action) => {
      if (state.profile) {
        state.profile = {...state.profile, ...action.payload};
      }
    },
  },
  extraReducers: builder => {
    // ========================================================================
    // Fetch Profile
    // ========================================================================
    builder.addCase(fetchProfile.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.profile = action.payload;
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    });
    builder.addCase(fetchProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Update Profile
    // ========================================================================
    builder.addCase(updateProfile.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.profile = action.payload;
      state.lastUpdated = new Date().toISOString();
      state.error = null;
    });
    builder.addCase(updateProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Load from Storage
    // ========================================================================
    builder.addCase(loadProfileFromStorage.pending, state => {
      state.loading = true;
    });
    builder.addCase(loadProfileFromStorage.fulfilled, (state, action) => {
      state.loading = false;
      state.profile = action.payload;
    });
    builder.addCase(loadProfileFromStorage.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const {clearError, setProfile, clearProfile, updateProfileLocally} =
  studentSlice.actions;

export default studentSlice.reducer;
