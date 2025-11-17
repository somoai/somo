/**
 * Interests Selection Screen
 *
 * Fifth screen in onboarding flow.
 * Allows user to select subjects they're interested in.
 */

import React, {useState} from 'react';
import {View, Text, Pressable, StyleSheet, ScrollView} from 'react-native';
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
import {Colors, Typography, Spacing, BorderRadius} from '@constants/theme';

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'Interests'
>;

interface Subject {
  id: string;
  icon: string;
  label: string;
  category: 'core' | 'other';
}

const SUBJECTS: Subject[] = [
  {id: 'math', icon: '📐', label: 'Math', category: 'core'},
  {id: 'english', icon: '📚', label: 'English', category: 'core'},
  {id: 'science', icon: '🔬', label: 'Science', category: 'core'},
  {id: 'kiswahili', icon: '🇰🇪', label: 'Kiswahili', category: 'core'},
  {id: 'art', icon: '🎨', label: 'Art', category: 'other'},
  {id: 'music', icon: '🎵', label: 'Music', category: 'other'},
  {id: 'sports', icon: '⚽', label: 'Sports', category: 'other'},
  {id: 'coding', icon: '💻', label: 'Coding', category: 'other'},
  {id: 'geography', icon: '🌍', label: 'Geography', category: 'other'},
  {id: 'stories', icon: '📖', label: 'Stories', category: 'other'},
];

/**
 * Interest Card Component
 */
interface InterestCardProps {
  icon: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}

const InterestCard: React.FC<InterestCardProps> = ({
  icon,
  label,
  selected,
  onPress,
}) => (
  <Pressable
    onPress={onPress}
    style={[styles.interestCard, selected && styles.interestCardSelected]}
    accessibilityLabel={label}
    accessibilityRole="button"
    accessibilityState={{selected}}
  >
    <Text style={styles.cardIcon}>{icon}</Text>
    <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>
      {label}
    </Text>
  </Pressable>
);

/**
 * Interests Selection Screen Component
 */
const InterestsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  /**
   * Toggle interest selection
   */
  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev =>
      prev.includes(interestId)
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId],
    );
  };

  /**
   * Handle continue button press
   */
  const handleContinue = () => {
    dispatch(updateOnboardingData({interests: selectedInterests}));
    dispatch(nextStep());
    navigation.navigate('Notifications');
  };

  const coreSubjects = SUBJECTS.filter(s => s.category === 'core');
  const otherSubjects = SUBJECTS.filter(s => s.category === 'other');

  return (
    <OnboardingLayout
      currentStep={5}
      totalSteps={7}
      title="What Do You Love Learning? 💡"
      subtitle="Select subjects you're most interested in. We'll personalize your lessons!"
      onBack={() => navigation.goBack()}
      showSkip={false}
    >
      <View style={styles.content}>
        {/* Core subjects */}
        <Text style={styles.sectionTitle}>Core Subjects</Text>
        <View style={styles.subjectsGrid}>
          {coreSubjects.map(subject => (
            <InterestCard
              key={subject.id}
              icon={subject.icon}
              label={subject.label}
              selected={selectedInterests.includes(subject.id)}
              onPress={() => toggleInterest(subject.id)}
            />
          ))}
        </View>

        {/* Other interests */}
        <Text style={styles.sectionTitle}>Other Interests</Text>
        <View style={styles.subjectsGrid}>
          {otherSubjects.map(subject => (
            <InterestCard
              key={subject.id}
              icon={subject.icon}
              label={subject.label}
              selected={selectedInterests.includes(subject.id)}
              onPress={() => toggleInterest(subject.id)}
            />
          ))}
        </View>

        {/* Counter */}
        <Text style={styles.counter}>
          Selected: {selectedInterests.length} topic
          {selectedInterests.length !== 1 ? 's' : ''}
        </Text>

        {/* Continue button */}
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={selectedInterests.length === 0}
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
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  interestCard: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    padding: Spacing.sm,
  },
  interestCardSelected: {
    backgroundColor: Colors.primarySubtle,
    borderColor: Colors.primary,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  cardLabel: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  cardLabelSelected: {
    color: Colors.primary,
  },
  counter: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  button: {
    marginTop: 'auto',
  },
});

export default InterestsScreen;
