/**
 * Phone Number Screen
 *
 * First screen in authentication flow.
 * Collects and validates Kenyan phone number for OTP verification.
 */

import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {requestOTP} from '../../store/slices/authSlice';
import type {AuthStackParamList} from '../../navigation/types';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import {Colors, Typography, Spacing} from '@constants/theme';
import {
  validateKenyanPhone,
  formatKenyanPhone,
  normalizeKenyanPhone,
} from '../../utils/phoneUtils';

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'PhoneNumber'
>;

/**
 * Phone Number Screen Component
 */
const PhoneNumberScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useAppDispatch();
  const {loading, error} = useAppSelector(state => state.auth);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const inputRef = useRef(null);

  /**
   * Handle phone number input change
   * Automatically formats as user types
   */
  const handlePhoneChange = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');

    // Auto-add 254 prefix if user starts typing
    let fullNumber = digits;
    if (digits.length > 0 && !digits.startsWith('254')) {
      if (digits.startsWith('0')) {
        // Convert 0712... to 254712...
        fullNumber = '254' + digits.slice(1);
      } else if (digits.startsWith('7') || digits.startsWith('1')) {
        // Convert 712... to 254712...
        fullNumber = '254' + digits;
      }
    }

    setPhoneNumber(fullNumber);
    setFormattedPhone(formatKenyanPhone(fullNumber));
  };

  /**
   * Handle continue button press
   * Validates phone and requests OTP
   */
  const handleContinue = async () => {
    const normalizedPhone = normalizeKenyanPhone(phoneNumber);

    if (!validateKenyanPhone(normalizedPhone)) {
      return;
    }

    try {
      await dispatch(requestOTP(normalizedPhone)).unwrap();
      // Navigate to OTP screen
      navigation.navigate('OTPVerification', {phoneNumber: normalizedPhone});
    } catch (err) {
      // Error handled by Redux
      console.error('Failed to request OTP:', err);
    }
  };

  const normalizedPhone = normalizeKenyanPhone(phoneNumber);
  const isValid = validateKenyanPhone(normalizedPhone);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>👋</Text>
            <Text style={styles.title}>Welcome to SomoAI!</Text>
            <Text style={styles.subtitle}>
              Let's get you started with your learning journey.
            </Text>
          </View>

          {/* Phone input */}
          <View style={styles.inputContainer}>
            <Input
              value={formattedPhone}
              onChangeText={handlePhoneChange}
              placeholder="+254 7__ ___ ___"
              keyboardType="phone-pad"
              autoFocus
              label="Phone Number"
              error={error || undefined}
              maxLength={17} // +254 7XX XXX XXX
              containerStyle={styles.input}
            />

            <Text style={styles.helperText}>
              We'll send you a code to verify your number
            </Text>
          </View>

          {/* CTA */}
          <View style={styles.footer}>
            <Button
              title="Send Verification Code"
              onPress={handleContinue}
              disabled={!isValid || loading}
              loading={loading}
              fullWidth
              size="large"
              testID="send-code-button"
            />

            <Text style={styles.legalText}>
              By continuing, you agree to our{' '}
              <Text style={styles.link}>Terms</Text> &{' '}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xxxl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.base,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  input: {
    marginBottom: Spacing.xs,
  },
  helperText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  footer: {
    marginTop: 'auto',
    marginBottom: Spacing.xl,
  },
  legalText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: Typography.lineHeights.normal * Typography.sizes.xs,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});

export default PhoneNumberScreen;
