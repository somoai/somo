/**
 * Onboarding Navigator
 *
 * Stack navigator for onboarding flow:
 * 1. Language Selection
 * 2. Gender/Avatar Selection
 * 3. Name and Grade
 * 4. School Selection
 * 5. Interests
 * 6. Notifications
 * 7. Completion
 */

import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import type {OnboardingStackParamList} from './types';

// Import screens
import LanguageScreen from '../screens/onboarding/LanguageScreen';
import GenderScreen from '../screens/onboarding/GenderScreen';
import NameAndGradeScreen from '../screens/onboarding/NameAndGradeScreen';
import SchoolScreen from '../screens/onboarding/SchoolScreen';
import InterestsScreen from '../screens/onboarding/InterestsScreen';
import NotificationsScreen from '../screens/onboarding/NotificationsScreen';
import CompletionScreen from '../screens/onboarding/CompletionScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

/**
 * Onboarding Navigator Component
 */
export default function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true, // Allow swipe back
        animationEnabled: true,
      }}>
      <Stack.Screen
        name="Language"
        component={LanguageScreen}
        options={{
          title: 'Select Language',
          gestureEnabled: false, // First screen, no back
        }}
      />
      <Stack.Screen name="Gender" component={GenderScreen} />
      <Stack.Screen name="NameAndGrade" component={NameAndGradeScreen} />
      <Stack.Screen name="School" component={SchoolScreen} />
      <Stack.Screen name="Interests" component={InterestsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen
        name="Completion"
        component={CompletionScreen}
        options={{
          gestureEnabled: false, // Can't go back from completion
        }}
      />
    </Stack.Navigator>
  );
}
