/**
 * OTP Verification Screen
 *
 * Second screen in authentication flow.
 * Verifies phone number with 6-digit OTP code.
 * Features: auto-advance, countdown timer, resend functionality.
 */

import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  SafeAreaView,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {verifyOTP, requestOTP} from '../../store/slices/authSlice';
import type {AuthStackParamList} from '../../navigation/types';
import Button from '../../components/ui/Button';
import {Colors, Typography, Spacing, BorderRadius} from '@constants/theme';
import {maskKenyanPhone} from '../../utils/phoneUtils';

type NavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'OTPVerification'
>;
type ScreenRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;

/**
 * OTP Verification Screen Component
 */
const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const dispatch = useAppDispatch();
  const {loading, error} = useAppSelector(state => state.auth);

  const {phoneNumber} = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown === 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    const otpString = otp.join('');
    if (otpString.length === 6 && !loading) {
      handleVerify(otpString);
    }
  }, [otp, loading]);

  /**
   * Handle OTP input change
   * Auto-advances to next input
   */
  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Haptic feedback on each digit
    if (value) {
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
    }

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  /**
   * Handle backspace key
   * Auto-focuses previous input
   */
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Verify OTP code
   */
  const handleVerify = async (otpCode: string) => {
    try {
      const result = await dispatch(
        verifyOTP({
          phoneNumber,
          otpCode,
        }),
      ).unwrap();

      // Success haptic feedback
      ReactNativeHapticFeedback.trigger('notificationSuccess', {
        enableVibrateFallback: true,
      });

      // Navigate based on user status
      if (result.is_new_user) {
        // New user - go to onboarding
        navigation.replace('Onboarding' as any);
      } else {
        // Existing user - go to main app
        navigation.replace('Main' as any);
      }
    } catch (err) {
      // Error haptic feedback
      ReactNativeHapticFeedback.trigger('notificationError', {
        enableVibrateFallback: true,
      });

      // Clear OTP for retry
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  /**
   * Resend OTP code
   */
  const handleResend = async () => {
    if (!canResend) return;

    setCanResend(false);
    setCountdown(30); // 30 second cooldown after resend

    try {
      await dispatch(requestOTP(phoneNumber)).unwrap();
      // Success message handled by Redux
      ReactNativeHapticFeedback.trigger('notificationSuccess', {
        enableVibrateFallback: true,
      });
    } catch (err) {
      setCanResend(true);
      setCountdown(0);
    }
  };

  /**
   * Format countdown timer
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const maskedPhone = maskKenyanPhone(phoneNumber);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Back button */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Icon name="arrow-left" size={24} color={Colors.textPrimary} />
        </Pressable>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🔒</Text>
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phoneText}>{maskedPhone}</Text>
          </Text>
        </View>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => (inputRefs.current[index] = ref)}
              value={digit}
              onChangeText={value => handleOtpChange(value, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
                error && styles.otpInputError,
              ]}
              autoFocus={index === 0}
              selectTextOnFocus
              testID={`otp-input-${index}`}
            />
          ))}
        </View>

        {/* Error message */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Timer */}
        <View style={styles.timerContainer}>
          <Icon
            name="timer-outline"
            size={16}
            color={Colors.textSecondary}
            style={styles.timerIcon}
          />
          <Text style={styles.timerText}>
            Code expires in {formatTime(countdown)}
          </Text>
        </View>

        {/* Resend */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive it?</Text>
          <Pressable
            onPress={handleResend}
            disabled={!canResend}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          >
            <Text
              style={[
                styles.resendButton,
                !canResend && styles.resendButtonDisabled,
              ]}
            >
              Resend Code {!canResend && countdown > 0 && `(${countdown}s)`}
            </Text>
          </Pressable>
        </View>

        {/* CTA */}
        <Button
          title="Verify & Continue"
          onPress={() => handleVerify(otp.join(''))}
          disabled={otp.join('').length !== 6 || loading}
          loading={loading}
          fullWidth
          size="large"
          style={styles.button}
          testID="verify-button"
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.lg,
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
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.base,
  },
  phoneText: {
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
    color: Colors.textPrimary,
    backgroundColor: Colors.backgroundPrimary,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySubtle,
  },
  otpInputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: Typography.sizes.sm,
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  timerIcon: {
    marginRight: Spacing.xs,
  },
  timerText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  resendText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  resendButton: {
    fontSize: Typography.sizes.base,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  resendButtonDisabled: {
    color: Colors.textTertiary,
  },
  button: {
    marginTop: 'auto',
    marginBottom: Spacing.xl,
  },
});

export default OTPVerificationScreen;
