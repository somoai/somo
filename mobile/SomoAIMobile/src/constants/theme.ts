/**
 * SomoAI Theme Configuration
 *
 * Material Design theme with Kenyan flag colors
 * - Green: Primary color (from flag)
 * - Red: Accent color (from flag)
 * - Black: Text and borders (from flag)
 * - White: Background
 */

import {MD3LightTheme, configureFonts} from 'react-native-paper';
import type {MD3Theme} from 'react-native-paper';

// Color Palette
export const Colors = {
  // Primary Colors (Kenyan Flag)
  primary: '#006400', // Dark Green
  primaryLight: '#228B22', // Forest Green
  primaryDark: '#004D00',

  // Accent Colors
  accent: '#DC143C', // Crimson Red
  accentLight: '#FF6B6B',
  accentDark: '#B22222',

  // Neutral Colors
  black: '#000000',
  white: '#FFFFFF',
  background: '#F5F5F5',
  surface: '#FFFFFF',

  // Text Colors
  text: '#212121',
  textSecondary: '#757575',
  textDisabled: '#BDBDBD',

  // Status Colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',

  // Mastery Level Colors
  mastered: '#4CAF50', // Green (80-100%)
  proficient: '#8BC34A', // Light Green (70-79%)
  developing: '#FFC107', // Amber (60-69%)
  beginner: '#FF9800', // Orange (0-59%)

  // UI Elements
  border: '#E0E0E0',
  divider: '#EEEEEE',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Gradients
  gradientStart: '#006400',
  gradientEnd: '#228B22',
};

// Font Configuration
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
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 999,
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
