/**
 * Onboarding Layout Component
 *
 * Consistent wrapper for all onboarding screens with:
 * - Progress indicator at top
 * - Back/Skip buttons
 * - Scrollable content area
 * - Title and subtitle
 * - Optional illustration
 */

import React, {ReactNode} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Typography, Spacing, BorderRadius} from '@constants/theme';
import ProgressBar from '../ui/ProgressBar';

export interface OnboardingLayoutProps {
  /**
   * Current step (1-indexed)
   */
  currentStep: number;

  /**
   * Total number of steps
   */
  totalSteps: number;

  /**
   * Screen title
   */
  title: string;

  /**
   * Optional subtitle/description
   */
  subtitle?: string;

  /**
   * Optional illustration component
   */
  illustration?: ReactNode;

  /**
   * Content to render
   */
  children: ReactNode;

  /**
   * Back button handler (if omitted, no back button shown)
   */
  onBack?: () => void;

  /**
   * Skip button handler (if omitted, no skip button shown)
   */
  onSkip?: () => void;

  /**
   * Whether to show skip button
   * @default true
   */
  showSkip?: boolean;

  /**
   * Whether to hide progress indicator
   * @default false
   */
  hideProgress?: boolean;
}

/**
 * Onboarding Layout Component
 */
const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  currentStep,
  totalSteps,
  title,
  subtitle,
  illustration,
  children,
  onBack,
  onSkip,
  showSkip = true,
  hideProgress = false,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.backgroundPrimary} />
      <View style={styles.container}>
        {/* Header with back button, progress, and skip */}
        <View style={styles.header}>
          {/* Back button or spacer */}
          <View style={styles.backContainer}>
            {onBack ? (
              <TouchableOpacity
                onPress={onBack}
                style={styles.backButton}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            ) : (
              <View style={styles.backButton} />
            )}
          </View>

          {/* Progress bar */}
          {!hideProgress && (
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={(currentStep / totalSteps) * 100}
                segmented
                segments={totalSteps}
                activeSegment={currentStep - 1}
                height={4}
              />
            </View>
          )}

          {/* Skip button or spacer */}
          <View style={styles.skipContainer}>
            {showSkip && onSkip ? (
              <TouchableOpacity
                onPress={onSkip}
                style={styles.skipButton}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                accessibilityLabel="Skip onboarding"
                accessibilityRole="button"
              >
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.skipButton} />
            )}
          </View>
        </View>

        {/* Content area */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Illustration (if provided) */}
          {illustration && (
            <View style={styles.illustrationContainer}>{illustration}</View>
          )}

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Subtitle */}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

          {/* Custom content */}
          <View style={styles.childrenContainer}>{children}</View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    height: 60,
  },
  backContainer: {
    width: 50,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  skipContainer: {
    width: 50,
  },
  skipButton: {
    paddingHorizontal: Spacing.xs,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: Typography.sizes.base,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.base,
    marginBottom: Spacing.xl,
  },
  childrenContainer: {
    flex: 1,
  },
});

export default OnboardingLayout;
