/**
 * Onboarding Completion Screen
 *
 * Final screen in onboarding flow.
 * Celebrates completion and transitions to main app.
 */

import React, {useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {completeOnboarding} from '../../store/slices/onboardingSlice';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import Button from '../../components/ui/Button';
import SimpleIllustration from '../../components/illustrations/SimpleIllustration';
import {Colors, Typography, Spacing} from '@constants/theme';

/**
 * Completion Screen Component
 */
const CompletionScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const {data} = useAppSelector(state => state.onboarding);

  /**
   * Handle getting started button press
   */
  const handleGetStarted = () => {
    // Mark onboarding as completed
    dispatch(completeOnboarding());
    // Navigation will automatically switch to Main navigator
    // based on onboarding.completed state in RootNavigator
  };

  return (
    <OnboardingLayout
      currentStep={7}
      totalSteps={7}
      title={`You're All Set, ${data.name || 'Champion'}! 🎉`}
      subtitle="Welcome to SomoAI! Let's start your learning journey together."
      showSkip={false}
      hideProgress={true}
      illustration={
        <View style={styles.illustrationContainer}>
          <SimpleIllustration emoji="🎉" size={200} />
        </View>
      }
    >
      <View style={styles.content}>
        {/* Success message */}
        <View style={styles.messageContainer}>
          <Text style={styles.message}>
            We're excited to help you learn and grow! Your personalized learning
            experience is ready.
          </Text>
        </View>

        {/* Features preview */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>📚</Text>
            <Text style={styles.featureText}>
              Personalized lessons matched to your level
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>🎯</Text>
            <Text style={styles.featureText}>
              Track your progress and achievements
            </Text>
          </View>

          <View style={styles.featureItem}>
            <Text style={styles.featureEmoji}>⭐</Text>
            <Text style={styles.featureText}>
              Earn rewards as you master new concepts
            </Text>
          </View>
        </View>

        {/* Get started button */}
        <Button
          title="Let's Start Learning! 🚀"
          onPress={handleGetStarted}
          fullWidth
          size="large"
          style={styles.button}
          testID="get-started-button"
        />
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  illustrationContainer: {
    marginBottom: Spacing.lg,
  },
  content: {
    flex: 1,
  },
  messageContainer: {
    marginBottom: Spacing.xl,
  },
  message: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.base,
  },
  featuresContainer: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primarySubtle,
    padding: Spacing.md,
    borderRadius: 12,
  },
  featureEmoji: {
    fontSize: 28,
  },
  featureText: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    color: Colors.textPrimary,
  },
  button: {
    marginTop: 'auto',
  },
});

export default CompletionScreen;
