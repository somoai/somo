/**
 * Gender Selection Screen
 *
 * Second screen in onboarding flow.
 * Allows user to select their gender for personalized experience.
 */

import React, {useState} from 'react';
import {View, Text, Pressable, TouchableOpacity, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAppDispatch} from '../../store/hooks';
import {
  updateOnboardingData,
  nextStep,
} from '../../store/slices/onboardingSlice';
import type {OnboardingStackParamList} from '../../navigation/types';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import Button from '../../components/ui/Button';
import AvatarPreview from '../../components/onboarding/AvatarPreview';
import {Colors, Typography, Spacing, BorderRadius} from '@constants/theme';

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'Gender'
>;

/**
 * Gender Selection Screen Component
 */
const GenderScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const [selectedGender, setSelectedGender] = useState<
    'boy' | 'girl' | 'other' | null
  >(null);

  /**
   * Handle continue button press
   */
  const handleContinue = () => {
    if (selectedGender) {
      dispatch(updateOnboardingData({gender: selectedGender}));
      dispatch(nextStep());
      navigation.navigate('NameAndGrade');
    }
  };

  /**
   * Handle skip button press
   */
  const handleSkip = () => {
    dispatch(nextStep());
    navigation.navigate('NameAndGrade');
  };

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={7}
      title="I am a..."
      subtitle="To give you a customized experience we need to know your gender"
      onBack={() => navigation.goBack()}
      onSkip={handleSkip}
      illustration={<AvatarPreview gender={selectedGender} size={180} />}
    >
      <View style={styles.content}>
        {/* Gender options */}
        <View style={styles.genderOptions}>
          <Pressable
            onPress={() => setSelectedGender('boy')}
            style={[
              styles.genderButton,
              selectedGender === 'boy' && styles.genderButtonSelected,
            ]}
            accessibilityLabel="Boy"
            accessibilityRole="button"
            accessibilityState={{selected: selectedGender === 'boy'}}
          >
            <Text
              style={[
                styles.genderText,
                selectedGender === 'boy' && styles.genderTextSelected,
              ]}
            >
              Boy
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSelectedGender('girl')}
            style={[
              styles.genderButton,
              selectedGender === 'girl' && styles.genderButtonSelected,
            ]}
            accessibilityLabel="Girl"
            accessibilityRole="button"
            accessibilityState={{selected: selectedGender === 'girl'}}
          >
            <Text
              style={[
                styles.genderText,
                selectedGender === 'girl' && styles.genderTextSelected,
              ]}
            >
              Girl
            </Text>
          </Pressable>
        </View>

        {/* Prefer not to choose */}
        <TouchableOpacity
          onPress={() => setSelectedGender('other')}
          style={styles.preferNotButton}
          accessibilityLabel="Prefer not to choose"
          accessibilityRole="button"
        >
          <Text style={styles.preferNotText}>Prefer not to choose</Text>
        </TouchableOpacity>

        {/* Continue button */}
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedGender}
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
  genderOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  genderButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    minWidth: 120,
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  genderButtonSelected: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  genderText: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  genderTextSelected: {
    color: Colors.backgroundPrimary,
  },
  preferNotButton: {
    alignSelf: 'center',
    padding: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  preferNotText: {
    fontSize: Typography.sizes.base,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: 'auto',
  },
});

export default GenderScreen;
