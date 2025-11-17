/**
 * Onboarding Redux Slice
 *
 * Manages onboarding flow state including:
 * - Current step tracking
 * - User onboarding data collection
 * - Onboarding completion status
 */

import {createSlice, PayloadAction} from '@reduxjs/toolkit';

/**
 * Avatar configuration interface
 */
export interface AvatarConfig {
  gender: 'boy' | 'girl' | 'other';
  skinTone: number; // 1-5
  hairStyle: number;
  outfit: number;
}

/**
 * Onboarding data interface
 */
export interface OnboardingData {
  language?: 'en' | 'sw';
  gender?: 'boy' | 'girl' | 'other';
  name?: string;
  gradeLevel?: number;
  schoolId?: string;
  interests?: string[];
  notificationsEnabled?: boolean;
  avatar?: AvatarConfig;
}

/**
 * Onboarding state interface
 */
export interface OnboardingState {
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  data: OnboardingData;
}

/**
 * Initial state
 */
const initialState: OnboardingState = {
  currentStep: 0,
  totalSteps: 7,
  completed: false,
  data: {
    language: 'en',
    notificationsEnabled: true,
  },
};

// ============================================================================
// Slice
// ============================================================================

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    /**
     * Move to next onboarding step
     */
    nextStep: state => {
      if (state.currentStep < state.totalSteps - 1) {
        state.currentStep += 1;
      }
    },

    /**
     * Move to previous onboarding step
     */
    previousStep: state => {
      if (state.currentStep > 0) {
        state.currentStep -= 1;
      }
    },

    /**
     * Go to specific step
     */
    goToStep: (state, action: PayloadAction<number>) => {
      const step = action.payload;
      if (step >= 0 && step < state.totalSteps) {
        state.currentStep = step;
      }
    },

    /**
     * Update onboarding data
     */
    updateOnboardingData: (
      state,
      action: PayloadAction<Partial<OnboardingData>>,
    ) => {
      state.data = {...state.data, ...action.payload};
    },

    /**
     * Set language
     */
    setLanguage: (state, action: PayloadAction<'en' | 'sw'>) => {
      state.data.language = action.payload;
    },

    /**
     * Set avatar configuration
     */
    setAvatar: (state, action: PayloadAction<AvatarConfig>) => {
      state.data.avatar = action.payload;
    },

    /**
     * Set interests
     */
    setInterests: (state, action: PayloadAction<string[]>) => {
      state.data.interests = action.payload;
    },

    /**
     * Toggle notification permission
     */
    toggleNotifications: state => {
      state.data.notificationsEnabled = !state.data.notificationsEnabled;
    },

    /**
     * Complete onboarding
     */
    completeOnboarding: state => {
      state.completed = true;
    },

    /**
     * Reset onboarding state
     */
    resetOnboarding: () => initialState,

    /**
     * Skip onboarding (for returning users)
     */
    skipOnboarding: state => {
      state.completed = true;
      state.currentStep = state.totalSteps;
    },
  },
});

export const {
  nextStep,
  previousStep,
  goToStep,
  updateOnboardingData,
  setLanguage,
  setAvatar,
  setInterests,
  toggleNotifications,
  completeOnboarding,
  resetOnboarding,
  skipOnboarding,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
