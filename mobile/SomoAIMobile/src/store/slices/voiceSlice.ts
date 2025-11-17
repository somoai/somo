/**
 * Voice Tutor Redux Slice
 *
 * Manages voice tutor state including:
 * - Usage tracking (minutes per day)
 * - Session history
 * - Tier limits
 * - Cost tracking
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS, AI_CONFIG} from '@constants/config';
import type {VoiceSession} from '@services/voiceTutor';

/**
 * Daily usage interface
 */
export interface VoiceDailyUsage {
  date: string; // YYYY-MM-DD
  minutesUsed: number;
  sessionsCount: number;
  totalCost: number;
}

/**
 * User tier enum
 */
export enum VoiceTier {
  FREE = 'free',
  PREMIUM = 'premium',
}

/**
 * Voice state interface
 */
export interface VoiceState {
  currentSession: VoiceSession | null;
  dailyUsage: VoiceDailyUsage | null;
  sessionHistory: VoiceSession[];
  currentTier: VoiceTier;
  loading: boolean;
  error: string | null;
}

/**
 * Initial state
 */
const initialState: VoiceState = {
  currentSession: null,
  dailyUsage: null,
  sessionHistory: [],
  currentTier: VoiceTier.FREE,
  loading: false,
  error: null,
};

/**
 * Helper: Get today's date string
 */
const getTodayDateString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
};

// ============================================================================
// Async Thunks
// ============================================================================

/**
 * Load voice usage from storage
 */
export const loadVoiceUsage = createAsyncThunk(
  'voice/loadUsage',
  async (_, {rejectWithValue}) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.VOICE_USAGE);
      if (!stored) {
        return null;
      }

      const usage: VoiceDailyUsage = JSON.parse(stored);
      const today = getTodayDateString();

      // Reset if it's a new day
      if (usage.date !== today) {
        return {
          date: today,
          minutesUsed: 0,
          sessionsCount: 0,
          totalCost: 0,
        };
      }

      return usage;
    } catch (error) {
      console.error('Failed to load voice usage:', error);
      return rejectWithValue('Failed to load usage data');
    }
  },
);

/**
 * Save voice usage to storage
 */
export const saveVoiceUsage = createAsyncThunk(
  'voice/saveUsage',
  async (usage: VoiceDailyUsage, {rejectWithValue}) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.VOICE_USAGE,
        JSON.stringify(usage),
      );
      return usage;
    } catch (error) {
      console.error('Failed to save voice usage:', error);
      return rejectWithValue('Failed to save usage data');
    }
  },
);

/**
 * Load session history from storage
 */
export const loadSessionHistory = createAsyncThunk(
  'voice/loadHistory',
  async (_, {rejectWithValue}) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.VOICE_SESSIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load session history:', error);
      return rejectWithValue('Failed to load session history');
    }
  },
);

/**
 * Save session history to storage
 */
export const saveSessionHistory = createAsyncThunk(
  'voice/saveHistory',
  async (history: VoiceSession[], {rejectWithValue}) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.VOICE_SESSIONS,
        JSON.stringify(history),
      );
      return history;
    } catch (error) {
      console.error('Failed to save session history:', error);
      return rejectWithValue('Failed to save session history');
    }
  },
);

// ============================================================================
// Slice
// ============================================================================

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    /**
     * Start voice session
     */
    startVoiceSession: (state, action: PayloadAction<VoiceSession>) => {
      state.currentSession = action.payload;
    },

    /**
     * End voice session
     */
    endVoiceSession: (state, action: PayloadAction<{minutesUsed: number}>) => {
      if (state.currentSession) {
        const session = {
          ...state.currentSession,
          status: 'ended' as const,
          minutesUsed: action.payload.minutesUsed,
        };

        // Add to history
        state.sessionHistory.unshift(session);

        // Keep only last 50 sessions
        if (state.sessionHistory.length > 50) {
          state.sessionHistory = state.sessionHistory.slice(0, 50);
        }

        state.currentSession = null;
      }
    },

    /**
     * Track voice usage
     */
    trackVoiceUsage: (state, action: PayloadAction<number>) => {
      const minutesUsed = action.payload;
      const today = getTodayDateString();

      // Initialize or reset daily usage if new day
      if (!state.dailyUsage || state.dailyUsage.date !== today) {
        state.dailyUsage = {
          date: today,
          minutesUsed: 0,
          sessionsCount: 0,
          totalCost: 0,
        };
      }

      // Update usage
      state.dailyUsage.minutesUsed += minutesUsed;
      state.dailyUsage.sessionsCount += 1;
      state.dailyUsage.totalCost +=
        minutesUsed * AI_CONFIG.VOICE_TUTOR_COST_PER_MINUTE;
    },

    /**
     * Set user tier
     */
    setVoiceTier: (state, action: PayloadAction<VoiceTier>) => {
      state.currentTier = action.payload;
    },

    /**
     * Clear error
     */
    clearVoiceError: state => {
      state.error = null;
    },

    /**
     * Reset voice state
     */
    resetVoiceState: state => {
      state.currentSession = null;
      state.dailyUsage = null;
      state.sessionHistory = [];
      state.error = null;
    },
  },
  extraReducers: builder => {
    // Load voice usage
    builder
      .addCase(loadVoiceUsage.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadVoiceUsage.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyUsage = action.payload;

        // Initialize if null
        if (!state.dailyUsage) {
          state.dailyUsage = {
            date: getTodayDateString(),
            minutesUsed: 0,
            sessionsCount: 0,
            totalCost: 0,
          };
        }
      })
      .addCase(loadVoiceUsage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Load session history
    builder
      .addCase(loadSessionHistory.pending, state => {
        state.loading = true;
      })
      .addCase(loadSessionHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.sessionHistory = action.payload;
      })
      .addCase(loadSessionHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Save operations (background, no loading state)
    builder
      .addCase(saveVoiceUsage.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(saveSessionHistory.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// ============================================================================
// Exports
// ============================================================================

export const {
  startVoiceSession,
  endVoiceSession,
  trackVoiceUsage,
  setVoiceTier,
  clearVoiceError,
  resetVoiceState,
} = voiceSlice.actions;

export default voiceSlice.reducer;

// ============================================================================
// Selectors
// ============================================================================

/**
 * Check if user has reached daily limit
 */
export const selectHasReachedVoiceLimit = (state: {voice: VoiceState}) => {
  const {dailyUsage, currentTier} = state.voice;
  if (!dailyUsage) return false;

  const limit =
    currentTier === VoiceTier.PREMIUM
      ? AI_CONFIG.VOICE_TUTOR_PREMIUM_MINUTES_PER_DAY
      : AI_CONFIG.VOICE_TUTOR_FREE_MINUTES_PER_DAY;

  return dailyUsage.minutesUsed >= limit;
};

/**
 * Get remaining minutes for today
 */
export const selectRemainingVoiceMinutes = (state: {voice: VoiceState}) => {
  const {dailyUsage, currentTier} = state.voice;
  if (!dailyUsage) return 0;

  const limit =
    currentTier === VoiceTier.PREMIUM
      ? AI_CONFIG.VOICE_TUTOR_PREMIUM_MINUTES_PER_DAY
      : AI_CONFIG.VOICE_TUTOR_FREE_MINUTES_PER_DAY;

  return Math.max(0, limit - dailyUsage.minutesUsed);
};

/**
 * Get current session status
 */
export const selectIsVoiceSessionActive = (state: {voice: VoiceState}) => {
  return state.voice.currentSession?.status === 'active';
};
