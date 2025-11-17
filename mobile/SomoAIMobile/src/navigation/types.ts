/**
 * Navigation Type Definitions
 *
 * TypeScript types for React Navigation.
 * Provides type safety for navigation throughout the app.
 */

import type {StackScreenProps} from '@react-navigation/stack';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {CompositeScreenProps} from '@react-navigation/native';

// ============================================================================
// Root Stack
// ============================================================================

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

// ============================================================================
// Auth Stack
// ============================================================================

export type AuthStackParamList = {
  PhoneNumber: undefined;
  OTPVerification: {phoneNumber: string};
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  CompositeScreenProps<
    StackScreenProps<AuthStackParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

// ============================================================================
// Onboarding Stack
// ============================================================================

export type OnboardingStackParamList = {
  Language: undefined;
  Gender: undefined;
  NameAndGrade: undefined;
  School: undefined;
  Interests: undefined;
  Notifications: undefined;
  Completion: undefined;
};

export type OnboardingStackScreenProps<
  T extends keyof OnboardingStackParamList,
> = CompositeScreenProps<
  StackScreenProps<OnboardingStackParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

// ============================================================================
// Main Tab
// ============================================================================

export type MainTabParamList = {
  Home: undefined;
  Learn: undefined;
  Chat: undefined;
  Progress: undefined;
  Settings: undefined;
};

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

// ============================================================================
// Navigation Declarations
// ============================================================================

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
