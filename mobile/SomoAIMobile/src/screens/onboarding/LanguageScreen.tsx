/**
 * Language Selection Screen
 *
 * First screen in onboarding flow.
 * Allows user to choose their preferred learning language.
 */

import React, {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
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
import SelectableCard from '../../components/ui/SelectableCard';
import SimpleIllustration from '../../components/illustrations/SimpleIllustration';
import {Colors, Typography, Spacing} from '@constants/theme';

type NavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  'Language'
>;

/**
 * Language Selection Screen Component
 */
const LanguageScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'sw' | null>(
    null,
  );

  /**
   * Handle continue button press
   */
  const handleContinue = () => {
    if (selectedLanguage) {
      dispatch(updateOnboardingData({language: selectedLanguage}));
      dispatch(nextStep());
      navigation.navigate('Gender');
    }
  };

  /**
   * Handle skip button press (defaults to English)
   */
  const handleSkip = () => {
    dispatch(updateOnboardingData({language: 'en'}));
    dispatch(nextStep());
    navigation.navigate('Gender');
  };

  return (
    <OnboardingLayout
      currentStep={1}
      totalSteps={7}
      title="Choose Your Learning Language 🌍"
      subtitle="Pick the language you're most comfortable with. You can change this anytime in settings."
      onSkip={handleSkip}
      illustration={<SimpleIllustration emoji="📚🌍" size={160} />}
    >
      <View style={styles.content}>
        {/* Language options */}
        <View style={styles.cardsContainer}>
          <SelectableCard
            title="🇬🇧 English"
            description="Recommended for Grade 4+"
            selected={selectedLanguage === 'en'}
            onPress={() => setSelectedLanguage('en')}
            testID="language-english"
          />

          <SelectableCard
            title="🇰🇪 Kiswahili"
            description="Recommended for Grade 1-3"
            selected={selectedLanguage === 'sw'}
            onPress={() => setSelectedLanguage('sw')}
            style={styles.card}
            testID="language-swahili"
          />
        </View>

        {/* Footnote */}
        <Text style={styles.footnote}>More languages coming soon! 🚀</Text>

        {/* Continue button */}
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={!selectedLanguage}
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
  cardsContainer: {
    marginBottom: Spacing.xl,
  },
  card: {
    marginTop: Spacing.md,
  },
  footnote: {
    fontSize: Typography.sizes.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  button: {
    marginTop: 'auto',
  },
});

export default LanguageScreen;
