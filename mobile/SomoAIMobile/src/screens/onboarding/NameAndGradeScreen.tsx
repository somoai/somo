/**
 * Name and Grade Screen
 *
 * Third screen in onboarding flow.
 * Collects student's name and grade level.
 */

import React, {useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
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
import {Colors, Typography, Spacing, BorderRadius} from '@constants/theme';

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'NameAndGrade'
>;

const GRADES = [1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Name and Grade Screen Component
 */
const NameAndGradeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  /**
   * Handle continue button press
   */
  const handleContinue = () => {
    if (name.trim() && selectedGrade) {
      dispatch(
        updateOnboardingData({
          name: name.trim(),
          gradeLevel: selectedGrade,
        }),
      );
      dispatch(nextStep());
      navigation.navigate('School');
    }
  };

  return (
    <OnboardingLayout
      currentStep={3}
      totalSteps={7}
      title="Tell Us About Yourself 📚"
      onBack={() => navigation.goBack()}
      showSkip={false}
    >
      <View style={styles.content}>
        {/* Name input */}
        <Input
          label="What's your name?"
          value={name}
          onChangeText={setName}
          placeholder="Enter your first name"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={50}
          containerStyle={styles.nameInput}
        />

        {/* Grade selection */}
        <Text style={styles.gradeLabel}>Which grade are you in?</Text>

        <View style={styles.gradeGrid}>
          {GRADES.map(grade => (
            <Pressable
              key={grade}
              onPress={() => setSelectedGrade(grade)}
              style={[
                styles.gradeButton,
                selectedGrade === grade && styles.gradeButtonSelected,
              ]}
              accessibilityLabel={`Grade ${grade}`}
              accessibilityRole="button"
              accessibilityState={{selected: selectedGrade === grade}}
            >
              <Text
                style={[
                  styles.gradeText,
                  selectedGrade === grade && styles.gradeTextSelected,
                ]}
              >
                {grade}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Reassurance message */}
        <View style={styles.reassurance}>
          <Icon name="target" size={20} color={Colors.info} />
          <Text style={styles.reassuranceText}>
            Don't worry, we'll match lessons to your level!
          </Text>
        </View>

        {/* Continue button */}
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!name.trim() || !selectedGrade}
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
  nameInput: {
    marginBottom: Spacing.lg,
  },
  gradeLabel: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  gradeButton: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  gradeButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  gradeText: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  gradeTextSelected: {
    color: Colors.backgroundPrimary,
  },
  reassurance: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySubtle,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  reassuranceText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
  },
  button: {
    marginTop: 'auto',
  },
});

export default NameAndGradeScreen;
