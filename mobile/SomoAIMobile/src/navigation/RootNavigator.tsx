/**
 * Root Navigator
 *
 * Main navigation controller that determines which stack to show:
 * - Splash screen on app load
 * - Auth stack if not authenticated
 * - Onboarding stack if authenticated but not onboarded
 * - Main stack if authenticated and onboarded
 */

import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import type {RootStackParamList} from './types';
import {useAppSelector} from '../store/hooks';

// Import navigators
import AuthNavigator from './AuthNavigator';
import OnboardingNavigator from './OnboardingNavigator';
import MainNavigator from './MainNavigator';

// Import screens
import SplashScreen from '../screens/SplashScreen';

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Root Navigator Component
 */
export default function RootNavigator() {
  const {isAuthenticated} = useAppSelector(state => state.auth);
  const {completed: onboardingCompleted} = useAppSelector(
    state => state.onboarding,
  );
  const [isReady, setIsReady] = useState(false);

  // Simulate app initialization
  useEffect(() => {
    const init = async () => {
      // TODO: Initialize app
      // - Check network connectivity
      // - Load cached data
      // - Setup analytics
      // - Check for updates

      // Small delay for splash screen
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsReady(true);
    };

    init();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!isReady ? (
          // Show splash screen while initializing
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : !isAuthenticated ? (
          // Show auth flow if not authenticated
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{
              animationEnabled: true,
              animationTypeForReplace: 'pop',
            }}
          />
        ) : !onboardingCompleted ? (
          // Show onboarding if not completed
          <Stack.Screen
            name="Onboarding"
            component={OnboardingNavigator}
            options={{
              animationEnabled: true,
            }}
          />
        ) : (
          // Show main app
          <Stack.Screen
            name="Main"
            component={MainNavigator}
            options={{
              animationEnabled: true,
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
