/**
 * Notifications Permission Screen
 *
 * Sixth screen in onboarding flow.
 * Asks for notification permissions.
 */

import React, {useState} from 'react';
import {View, Text, Switch, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAppDispatch} from '../../store/hooks';
import {
  updateOnboardingData,
  nextStep,
} from '../../store/slices/onboardingSlice';
import type {OnboardingStackParamList} from '../../navigation/types';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import Button from '../../components/ui/Button';
import SimpleIllustration from '../../components/illustrations/SimpleIllustration';
import {Colors, Typography, Spacing, BorderRadius} from '@constants/theme';

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'Notifications'
>;

/**
 * Notifications Screen Component
 */
const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  /**
   * Handle continue button press
   */
  const handleContinue = () => {
    dispatch(updateOnboardingData({notificationsEnabled}));
    dispatch(nextStep());
    navigation.navigate('Completion');
  };

  /**
   * Handle skip button press
   */
  const handleSkip = () => {
    dispatch(updateOnboardingData({notificationsEnabled: false}));
    dispatch(nextStep());
    navigation.navigate('Completion');
  };

  return (
    <OnboardingLayout
      currentStep={6}
      totalSteps={7}
      title="Stay on Track with Reminders 🔔"
      subtitle="Get helpful reminders to practice daily and achieve your learning goals!"
      onBack={() => navigation.goBack()}
      onSkip={handleSkip}
      illustration={<SimpleIllustration emoji="🔔" size={160} />}
    >
      <View style={styles.content}>
        {/* Notification benefits */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitItem}>
            <Icon name="calendar-check" size={24} color={Colors.success} />
            <Text style={styles.benefitText}>
              Daily practice reminders to keep you consistent
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Icon name="trophy" size={24} color={Colors.warning} />
            <Text style={styles.benefitText}>
              Celebrate achievements and milestones
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Icon name="lightbulb-on" size={24} color={Colors.primary} />
            <Text style={styles.benefitText}>
              Smart tips to improve your learning
            </Text>
          </View>
        </View>

        {/* Toggle switch */}
        <View style={styles.toggleContainer}>
          <View style={styles.toggleTextContainer}>
            <Text style={styles.toggleLabel}>Enable Notifications</Text>
            <Text style={styles.toggleDescription}>
              You can change this anytime in settings
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{false: Colors.border, true: Colors.primaryLight}}
            thumbColor={
              notificationsEnabled ? Colors.primary : Colors.backgroundPrimary
            }
          />
        </View>

        {/* Continue button */}
        <Button
          title="Continue"
          onPress={handleContinue}
          fullWidth
          size="large"
          style={styles.button}
          testID="continue-button"
        />
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  benefitsContainer: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  benefitText: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    fontWeight: Typography.weights.regular,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  toggleTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleLabel: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xxs,
  },
  toggleDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  button: {
    marginTop: 'auto',
  },
});

export default NotificationsScreen;
