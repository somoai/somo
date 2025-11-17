/**
 * Splash Screen
 *
 * Displayed while app initializes.
 * Shows animated logo and checks authentication/onboarding status.
 */

import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAppSelector} from '../store/hooks';
import type {RootStackParamList} from '../navigation/types';
import {Colors, Typography, Spacing} from '@constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

/**
 * Splash Screen Component
 */
const SplashScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {isAuthenticated} = useAppSelector(state => state.auth);
  const {completed: onboardingCompleted} = useAppSelector(
    state => state.onboarding,
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Animate logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after 2 seconds based on app state
    const timer = setTimeout(() => {
      // Navigation is handled by RootNavigator based on state
      // This splash screen will be replaced automatically
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      {/* Gradient background effect with overlays */}
      <View style={[StyleSheet.absoluteFillObject, styles.gradientOverlay]} />

      {/* Animated logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}
      >
        <Text style={styles.logoIcon}>🎓</Text>
        <Text style={styles.logoText}>SomoAI</Text>
        <Text style={styles.tagline}>Learn Anything, Anywhere, Anytime</Text>
      </Animated.View>

      {/* Loading indicator */}
      <View style={styles.footer}>
        <ActivityIndicator color={Colors.primary} size="small" />
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundPrimary,
  },
  gradientOverlay: {
    backgroundColor: Colors.primarySubtle,
    opacity: 0.3,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 80,
    marginBottom: Spacing.md,
  },
  logoText: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: Spacing.xxl,
    alignItems: 'center',
  },
  versionText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.sm,
  },
});

export default SplashScreen;
