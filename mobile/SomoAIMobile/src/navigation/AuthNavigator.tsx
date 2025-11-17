/**
 * Authentication Navigator
 *
 * Stack navigator for authentication flow:
 * 1. Phone Number Entry
 * 2. OTP Verification
 * 3. Registration (if new user)
 */

import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import type {AuthStackParamList} from './types';

// Import screens
import PhoneNumberScreen from '../screens/auth/PhoneNumberScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';

const Stack = createStackNavigator<AuthStackParamList>();

/**
 * Auth Navigator Component
 */
export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: false, // Disable swipe back
        animationEnabled: true,
      }}>
      <Stack.Screen
        name="PhoneNumber"
        component={PhoneNumberScreen}
        options={{
          title: 'Welcome',
        }}
      />
      <Stack.Screen
        name="OTPVerification"
        component={OTPVerificationScreen}
        options={{
          title: 'Verify',
          gestureEnabled: true, // Allow going back
        }}
      />
    </Stack.Navigator>
  );
}
