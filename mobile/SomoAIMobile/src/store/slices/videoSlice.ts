/**
 * Video Redux Slice
 *
 * State management for video tutoring sessions:
 * - Active session tracking
 * - Session history
 * - Usage tracking (minutes, cost)
 * - Daily limits
 * - AsyncStorage persistence
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import videoTutorService, {VideoSession} from '@services/videoTutor';
import {STORAGE_KEYS} from '@constants/config';

/**
 * Student profile for session creation
 */
interface StudentProfile {
  id: string;
  name: string;
  grade?: number;
  language?: string;
  struggles?: string[];
}

/**
 * Session history entry
 */
interface SessionHistoryEntry {
  sessionId: string;
  personaId: string;
  startedAt: string;
  endedAt: string;
  minutesUsed: number;
  cost: number;
}

/**
 * Video usage tracking
 */
interface VideoUsage {
  todayMinutesUsed: number;
  totalMinutesUsed: number;
  sessionsToday: number;
  totalCost: number;
  lastSessionDate: string;
}

/**
 * Video state interface
 */
interface VideoState {
  activeSession: {
    sessionId: string;
    conversationId: string;
    personaId: string;
    startedAt: string;
    status: 'initializing' | 'active' | 'paused' | 'ended';
    videoUrl?: string;
    streamUrl?: string;
  } | null;
  sessionHistory: SessionHistoryEntry[];
  usage: VideoUsage;
  loading: boolean;
  error: string | null;
}

/**
 * Initial state
 */
const initialState: VideoState = {
  activeSession: null,
  sessionHistory: [],
  usage: {
    todayMinutesUsed: 0,
    totalMinutesUsed: 0,
    sessionsToday: 0,
    totalCost: 0,
    lastSessionDate: '',
  },
  loading: false,
  error: null,
};

// ============================================================================
// Async Thunks
// ============================================================================

/**
 * Start video session
 */
export const startVideoSession = createAsyncThunk(
  'video/startSession',
  async (
    {
      student,
      personaId,
      concept,
    }: {student: StudentProfile; personaId: string; concept?: string},
    {rejectWithValue},
  ) => {
    try {
      const session = await videoTutorService.createVideoSession(
        student,
        personaId,
        concept,
      );
      return session;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to start video session');
    }
  },
);

/**
 * End video session
 */
export const endVideoSession = createAsyncThunk(
  'video/endSession',
  async (
    {sessionId, minutesUsed}: {sessionId: string; minutesUsed: number},
    {rejectWithValue},
  ) => {
    try {
      await videoTutorService.endSession(sessionId);
      const cost = videoTutorService.calculateCost(minutesUsed);
      return {sessionId, minutesUsed, cost};
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to end video session');
    }
  },
);

/**
 * Load persisted video state from AsyncStorage
 */
export const loadVideoState = createAsyncThunk(
  'video/loadState',
  async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.VIDEO_STATE);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Reset daily usage if new day
        const today = new Date().toISOString().split('T')[0];
        if (parsed.usage?.lastSessionDate !== today) {
          parsed.usage.todayMinutesUsed = 0;
          parsed.usage.sessionsToday = 0;
        }
        return parsed;
      }
      return initialState;
    } catch (error) {
      console.error('Failed to load video state:', error);
      return initialState;
    }
  },
);

// ============================================================================
// Slice
// ============================================================================

const videoSlice = createSlice({
  name: 'video',
  initialState,
  reducers: {
    /**
     * Track video usage
     */
    trackVideoUsage: (state, action: PayloadAction<number>) => {
      const today = new Date().toISOString().split('T')[0];

      // Reset daily usage if new day
      if (state.usage.lastSessionDate !== today) {
        state.usage.todayMinutesUsed = 0;
        state.usage.sessionsToday = 0;
      }

      // Update usage
      state.usage.todayMinutesUsed += action.payload;
      state.usage.totalMinutesUsed += action.payload;
      state.usage.sessionsToday += 1;
      state.usage.lastSessionDate = today;

      // Persist to AsyncStorage
      persistVideoState(state);
    },

    /**
     * Clear video error
     */
    clearVideoError: state => {
      state.error = null;
    },

    /**
     * Update session status
     */
    updateSessionStatus: (
      state,
      action: PayloadAction<'initializing' | 'active' | 'paused' | 'ended'>,
    ) => {
      if (state.activeSession) {
        state.activeSession.status = action.payload;
      }
    },

    /**
     * Clear active session
     */
    clearActiveSession: state => {
      state.activeSession = null;
      persistVideoState(state);
    },
  },
  extraReducers: builder => {
    builder
      // Start session
      .addCase(startVideoSession.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startVideoSession.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSession = {
          sessionId: action.payload.sessionId,
          conversationId: action.payload.conversationId,
          personaId: action.payload.personaId,
          startedAt: action.payload.startedAt.toISOString(),
          status: action.payload.status,
          videoUrl: action.payload.videoUrl,
          streamUrl: action.payload.streamUrl,
        };
        persistVideoState(state);
      })
      .addCase(startVideoSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // End session
      .addCase(endVideoSession.pending, state => {
        state.loading = true;
      })
      .addCase(endVideoSession.fulfilled, (state, action) => {
        state.loading = false;

        if (state.activeSession) {
          // Add to history
          state.sessionHistory.push({
            sessionId: action.payload.sessionId,
            personaId: state.activeSession.personaId,
            startedAt: state.activeSession.startedAt,
            endedAt: new Date().toISOString(),
            minutesUsed: action.payload.minutesUsed,
            cost: action.payload.cost,
          });

          // Keep only last 50 sessions
          if (state.sessionHistory.length > 50) {
            state.sessionHistory = state.sessionHistory.slice(-50);
          }

          // Update total cost
          state.usage.totalCost += action.payload.cost;
        }

        state.activeSession = null;
        persistVideoState(state);
      })
      .addCase(endVideoSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Load state
      .addCase(loadVideoState.fulfilled, (state, action) => {
        return {
          ...state,
          ...action.payload,
          loading: false,
        };
      });
  },
});

// ============================================================================
// Selectors
// ============================================================================

/**
 * Check if user has reached daily video limit (60 minutes for Premium)
 */
export const selectHasReachedVideoLimit = (state: {video: VideoState}) => {
  const {todayMinutesUsed} = state.video.usage;
  const limit = 60; // Premium tier: 60 minutes/day
  return todayMinutesUsed >= limit;
};

/**
 * Get remaining video minutes for today
 */
export const selectRemainingVideoMinutes = (state: {video: VideoState}) => {
  const {todayMinutesUsed} = state.video.usage;
  const limit = 60; // Premium tier: 60 minutes/day
  return Math.max(0, limit - todayMinutesUsed);
};

/**
 * Check if video session is active
 */
export const selectIsVideoSessionActive = (state: {video: VideoState}) => {
  return state.video.activeSession?.status === 'active';
};

/**
 * Get active session
 */
export const selectActiveVideoSession = (state: {video: VideoState}) => {
  return state.video.activeSession;
};

/**
 * Get today's usage stats
 */
export const selectTodayVideoUsage = (state: {video: VideoState}) => {
  return {
    minutesUsed: state.video.usage.todayMinutesUsed,
    sessionsCount: state.video.usage.sessionsToday,
  };
};

/**
 * Get total usage stats
 */
export const selectTotalVideoUsage = (state: {video: VideoState}) => {
  return {
    totalMinutes: state.video.usage.totalMinutesUsed,
    totalCost: state.video.usage.totalCost,
    totalSessions: state.video.sessionHistory.length,
  };
};

/**
 * Get session history
 */
export const selectVideoSessionHistory = (state: {video: VideoState}) => {
  return state.video.sessionHistory;
};

// ============================================================================
// Persistence Helper
// ============================================================================

/**
 * Persist video state to AsyncStorage
 */
const persistVideoState = async (state: VideoState) => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.VIDEO_STATE,
      JSON.stringify({
        sessionHistory: state.sessionHistory,
        usage: state.usage,
      }),
    );
  } catch (error) {
    console.error('Failed to persist video state:', error);
  }
};

// ============================================================================
// Exports
// ============================================================================

export const {
  trackVideoUsage,
  clearVideoError,
  updateSessionStatus,
  clearActiveSession,
} = videoSlice.actions;

export default videoSlice.reducer;
