/**
 * SomoAI Theme Configuration
 *
 * Modern design system with bright, friendly colors
 * Inspired by leading education apps with Kenyan context
 */

import {MD3LightTheme, configureFonts} from 'react-native-paper';
import type {MD3Theme} from 'react-native-paper';

// Color Palette
export const Colors = {
  // Primary Colors (Bright Blue - Modern Education Apps)
  primary: '#0099FF', // Bright Blue
  primaryLight: '#33AAFF',
  primaryDark: '#0077CC',
  primarySubtle: '#E6F5FF', // Very light blue for backgrounds

  // Secondary Colors
  secondary: '#FF6B9D', // Pink accent
  secondaryLight: '#FFB3C6',
  secondaryDark: '#CC5680',

  // Neutral Colors
  black: '#000000',
  white: '#FFFFFF',
  background: '#FFFFFF', // Pure white for clean look
  backgroundSecondary: '#F8F9FA', // Off-white
  backgroundGradient: {
    start: '#FFFFFF',
    end: '#F0F7FF', // Subtle blue tint
  },
  surface: '#FFFFFF',

  // Text Colors
  text: '#1A1D29', // Dark navy for headings
  textSecondary: '#6B7280', // Gray for descriptions
  textTertiary: '#9CA3AF', // Light gray for hints
  textInverse: '#FFFFFF',
  textDisabled: '#D1D5DB',

  // Status Colors
  success: '#10B981', // Modern green
  warning: '#F59E0B', // Warm orange
  error: '#EF4444', // Modern red
  info: '#0099FF', // Same as primary

  // Mastery Level Colors
  mastered: '#10B981', // Green (80-100%)
  proficient: '#10B981', // Green (70-79%)
  developing: '#F59E0B', // Orange (60-69%)
  beginner: '#EF4444', // Red (0-59%)

  // UI Elements
  border: '#E5E7EB', // Light gray border
  borderFocus: '#0099FF', // Blue border when focused
  divider: '#F3F4F6',
  overlay: 'rgba(0, 0, 0, 0.4)',
  shadow: 'rgba(0, 0, 0, 0.08)',

  // Kenya Colors (subtle accents)
  kenya: {
    green: '#006400',
    red: '#DC143C',
    black: '#000000',
  },
};

// Typography
export const Typography = {
  // Font Families (System fonts for now, can be customized later)
  fonts: {
    heading: 'System', // Bold, for titles
    body: 'System', // Regular, for body text
    button: 'System', // Medium, for buttons
    mono: 'Menlo', // Monospace, for codes
  },

  // Font Sizes
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 24, // Onboarding titles
    xxl: 32, // Hero titles
    xxxl: 40, // Large display
  },

  // Font Weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Font Configuration for Material Design
const fontConfig = {
  displayLarge: {
    fontFamily: 'System',
    fontSize: 57,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 64,
  },
  displayMedium: {
    fontFamily: 'System',
    fontSize: 45,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 52,
  },
  displaySmall: {
    fontFamily: 'System',
    fontSize: 36,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 44,
  },
  headlineLarge: {
    fontFamily: 'System',
    fontSize: 32,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 40,
  },
  headlineMedium: {
    fontFamily: 'System',
    fontSize: 28,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 36,
  },
  headlineSmall: {
    fontFamily: 'System',
    fontSize: 24,
    fontWeight: '400' as const,
    letterSpacing: 0,
    lineHeight: 32,
  },
  titleLarge: {
    fontFamily: 'System',
    fontSize: 22,
    fontWeight: '500' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '500' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  titleSmall: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  bodyLarge: {
    fontFamily: 'System',
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySmall: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  labelLarge: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  labelMedium: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  labelSmall: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.5,
    lineHeight: 16,
  },
};

// Material Design 3 Theme
export const theme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    primaryContainer: Colors.primaryLight,
    secondary: Colors.accent,
    secondaryContainer: Colors.accentLight,
    tertiary: Colors.info,
    tertiaryContainer: '#BBDEFB',
    surface: Colors.surface,
    surfaceVariant: Colors.background,
    surfaceDisabled: Colors.divider,
    background: Colors.background,
    error: Colors.error,
    errorContainer: '#FFCDD2',
    onPrimary: Colors.white,
    onPrimaryContainer: Colors.primaryDark,
    onSecondary: Colors.white,
    onSecondaryContainer: Colors.accentDark,
    onTertiary: Colors.white,
    onTertiaryContainer: '#01579B',
    onSurface: Colors.text,
    onSurfaceVariant: Colors.textSecondary,
    onSurfaceDisabled: Colors.textDisabled,
    onError: Colors.white,
    onErrorContainer: '#B71C1C',
    onBackground: Colors.text,
    outline: Colors.border,
    outlineVariant: Colors.divider,
    inverseSurface: Colors.black,
    inverseOnSurface: Colors.white,
    inversePrimary: Colors.primaryLight,
    shadow: Colors.black,
    scrim: Colors.overlay,
    backdrop: Colors.overlay,
  },
  fonts: configureFonts({config: fontConfig}),
};

// Spacing
export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border Radius
export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  round: 999,
};

// Component Sizes
export const ComponentSizes = {
  button: {
    small: 40,
    medium: 48,
    large: 56,
  },
  input: {
    small: 40,
    medium: 48,
    large: 56,
  },
  avatar: {
    xs: 24,
    sm: 32,
    md: 48,
    lg: 64,
    xl: 96,
  },
};

// Animation Durations (milliseconds)
export const AnimationDuration = {
  fast: 150,
  normal: 250,
  slow: 400,
};

// Animation Easings
export const AnimationEasing = {
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// Shadows
export const Shadows = {
  sm: {
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 3,
  },
  lg: {
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 6.0,
    elevation: 6,
  },
};

// Icon Sizes
export const IconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
};
