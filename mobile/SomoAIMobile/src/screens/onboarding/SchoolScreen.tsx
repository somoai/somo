/**
 * School Selection Screen
 *
 * Fourth screen in onboarding flow.
 * Allows user to search and select their school (optional).
 */

import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
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
import Input from '../../components/ui/Input';
import SimpleIllustration from '../../components/illustrations/SimpleIllustration';
import {Colors, Typography, Spacing} from '@constants/theme';

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'School'
>;

/**
 * School Selection Screen Component
 */
const SchoolScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Handle continue button press
   */
  const handleContinue = () => {
    // In a real implementation, we'd save selected school ID
    // For now, just continue to next step
    dispatch(nextStep());
    navigation.navigate('Interests');
  };

  /**
   * Handle skip button press
   */
  const handleSkip = () => {
    dispatch(nextStep());
    navigation.navigate('Interests');
  };

  return (
    <OnboardingLayout
      currentStep={4}
      totalSteps={7}
      title="Where Do You Go to School? 🏫"
      subtitle="This helps us connect you with classmates. You can add your school later too!"
      onBack={() => navigation.goBack()}
      onSkip={handleSkip}
      illustration={<SimpleIllustration emoji="🏫" size={160} />}
    >
      <View style={styles.content}>
        {/* School search input */}
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="🔍 Search for your school..."
          containerStyle={styles.searchInput}
        />

        {/* Empty state / Coming soon message */}
        <View style={styles.comingSoon}>
          <Icon name="information-outline" size={40} color={Colors.info} />
          <Text style={styles.comingSoonTitle}>School Directory Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            We're building a comprehensive directory of schools across Kenya.
            Skip for now and add your school later!
          </Text>
        </View>

        {/* Add school button */}
        <TouchableOpacity
          onPress={() => {
            /* TODO: Show add school modal */
          }}
          style={styles.addSchoolButton}
        >
          <Icon name="plus-circle" size={20} color={Colors.primary} />
          <Text style={styles.addSchoolText}>My school isn't listed</Text>
        </TouchableOpacity>

        {/* Action buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Skip for Now"
            onPress={handleSkip}
            variant="outline"
            style={styles.skipButton}
          />
          <Button
            title="Continue"
            onPress={handleContinue}
            style={styles.continueButton}
          />
        </View>
      </View>
    </OnboardingLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  searchInput: {
    marginBottom: Spacing.lg,
  },
  comingSoon: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.primarySubtle,
    borderRadius: 12,
    marginBottom: Spacing.lg,
  },
  comingSoonTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  comingSoonText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.sm,
  },
  addSchoolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  addSchoolText: {
    fontSize: Typography.sizes.base,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 'auto',
  },
  skipButton: {
    flex: 1,
  },
  continueButton: {
    flex: 1,
  },
});

export default SchoolScreen;
