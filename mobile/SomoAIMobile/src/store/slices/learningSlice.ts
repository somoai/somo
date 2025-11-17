/**
 * Learning Redux Slice
 *
 * Manages learning state including:
 * - Lesson recommendations
 * - Current lesson attempt
 * - Progress tracking
 * - Due reviews (spaced repetition)
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import api from '@services/api';
import type {
  NextLessonResponse,
  Lesson,
  StartLessonResponse,
  SubmitLessonResponse,
  Progress,
  Concept,
  Answer,
} from '@types/api';
import {APIError} from '@services/apiErrors';

/**
 * Learning state interface
 */
export interface LearningState {
  nextLesson: NextLessonResponse | null;
  lessonSequence: Lesson[];
  currentAttempt: StartLessonResponse | null;
  lastSubmission: SubmitLessonResponse | null;
  progress: Progress | null;
  dueReviews: Concept[];
  loading: boolean;
  error: string | null;
}

/**
 * Initial state
 */
const initialState: LearningState = {
  nextLesson: null,
  lessonSequence: [],
  currentAttempt: null,
  lastSubmission: null,
  progress: null,
  dueReviews: [],
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
 * Get next recommended lesson
 */
export const getNextLesson = createAsyncThunk(
  'learning/getNextLesson',
  async (subject: string | undefined, {rejectWithValue}) => {
    try {
      const response = await api.getNextLesson(subject);
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Get lesson sequence
 */
export const getLessonSequence = createAsyncThunk(
  'learning/getLessonSequence',
  async (
    {count, subject}: {count?: number; subject?: string},
    {rejectWithValue},
  ) => {
    try {
      const response = await api.getLessonSequence(count, subject);
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Start a lesson
 */
export const startLesson = createAsyncThunk(
  'learning/startLesson',
  async (lessonId: string, {rejectWithValue}) => {
    try {
      const response = await api.startLesson(lessonId);
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Submit lesson answers
 */
export const submitLesson = createAsyncThunk(
  'learning/submitLesson',
  async (
    {lessonId, answers}: {lessonId: string; answers: Answer[]},
    {rejectWithValue},
  ) => {
    try {
      const response = await api.submitLesson(lessonId, answers);
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Get progress summary
 */
export const getProgress = createAsyncThunk(
  'learning/getProgress',
  async (_, {rejectWithValue}) => {
    try {
      const response = await api.getProgress();
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

/**
 * Get due reviews
 */
export const getDueReviews = createAsyncThunk(
  'learning/getDueReviews',
  async (_, {rejectWithValue}) => {
    try {
      const response = await api.getDueReviews();
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ============================================================================
// Slice
// ============================================================================

const learningSlice = createSlice({
  name: 'learning',
  initialState,
  reducers: {
    /**
     * Clear error message
     */
    clearError: state => {
      state.error = null;
    },

    /**
     * Clear current attempt (exit lesson)
     */
    clearCurrentAttempt: state => {
      state.currentAttempt = null;
    },

    /**
     * Clear last submission
     */
    clearLastSubmission: state => {
      state.lastSubmission = null;
    },

    /**
     * Reset learning state
     */
    resetLearningState: () => initialState,
  },
  extraReducers: builder => {
    // ========================================================================
    // Get Next Lesson
    // ========================================================================
    builder.addCase(getNextLesson.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getNextLesson.fulfilled, (state, action) => {
      state.loading = false;
      state.nextLesson = action.payload;
      state.error = null;
    });
    builder.addCase(getNextLesson.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Get Lesson Sequence
    // ========================================================================
    builder.addCase(getLessonSequence.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getLessonSequence.fulfilled, (state, action) => {
      state.loading = false;
      state.lessonSequence = action.payload;
      state.error = null;
    });
    builder.addCase(getLessonSequence.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Start Lesson
    // ========================================================================
    builder.addCase(startLesson.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(startLesson.fulfilled, (state, action) => {
      state.loading = false;
      state.currentAttempt = action.payload;
      state.error = null;
    });
    builder.addCase(startLesson.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Submit Lesson
    // ========================================================================
    builder.addCase(submitLesson.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(submitLesson.fulfilled, (state, action) => {
      state.loading = false;
      state.lastSubmission = action.payload;
      state.currentAttempt = null; // Clear attempt after submission
      state.error = null;
    });
    builder.addCase(submitLesson.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Get Progress
    // ========================================================================
    builder.addCase(getProgress.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getProgress.fulfilled, (state, action) => {
      state.loading = false;
      state.progress = action.payload;
      state.error = null;
    });
    builder.addCase(getProgress.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ========================================================================
    // Get Due Reviews
    // ========================================================================
    builder.addCase(getDueReviews.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getDueReviews.fulfilled, (state, action) => {
      state.loading = false;
      state.dueReviews = action.payload;
      state.error = null;
    });
    builder.addCase(getDueReviews.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  clearError,
  clearCurrentAttempt,
  clearLastSubmission,
  resetLearningState,
} = learningSlice.actions;

export default learningSlice.reducer;
