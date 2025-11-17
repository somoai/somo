/**
 * Input Component
 *
 * Text input with automatic phone number formatting, error states,
 * and clear button functionality.
 *
 * @example
 * ```tsx
 * <Input
 *   value={phoneNumber}
 *   onChangeText={setPhoneNumber}
 *   placeholder="Enter phone number"
 *   keyboardType="phone-pad"
 *   autoFormat="phone"
 *   error={errors.phone}
 * />
 * ```
 */

import React, {useState} from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  Colors,
  Typography,
  BorderRadius,
  ComponentSizes,
  Spacing,
  AnimationDuration,
} from '@constants/theme';

export interface InputProps extends Omit<TextInputProps, 'onChangeText'> {
  /**
   * Input value
   */
  value: string;

  /**
   * Change handler
   */
  onChangeText: (text: string) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Auto-formatting type
   * @default 'none'
   */
  autoFormat?: 'phone' | 'none';

  /**
   * Error message
   */
  error?: string;

  /**
   * Icon to display on the left
   */
  icon?: React.ReactNode;

  /**
   * Icon to display on the right
   */
  iconRight?: React.ReactNode;

  /**
   * Show clear button when has value
   * @default true
   */
  showClearButton?: boolean;

  /**
   * Input size
   * @default 'large'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Container style
   */
  containerStyle?: ViewStyle;

  /**
   * Input style
   */
  inputStyle?: TextStyle;

  /**
   * Label text
   */
  label?: string;

  /**
   * Label style
   */
  labelStyle?: TextStyle;

  /**
   * Helper text (shown below input)
   */
  helperText?: string;

  /**
   * Disabled state
   */
  disabled?: boolean;
}

/**
 * Format phone number to Kenyan format (+254 7XX XXX XXX)
 */
const formatPhoneNumber = (text: string): string => {
  // Remove all non-digits
  const digits = text.replace(/\D/g, '');

  // Handle different input formats
  let formatted = '';

  if (digits.startsWith('254')) {
    // Already has country code
    const cleanDigits = digits.slice(3);
    formatted = `+254 ${cleanDigits.slice(0, 3)} ${cleanDigits.slice(
      3,
      6,
    )} ${cleanDigits.slice(6, 9)}`;
  } else if (digits.startsWith('0')) {
    // Starts with 0
    const cleanDigits = digits.slice(1);
    formatted = `+254 ${cleanDigits.slice(0, 3)} ${cleanDigits.slice(
      3,
      6,
    )} ${cleanDigits.slice(6, 9)}`;
  } else {
    // No prefix
    formatted = `+254 ${digits.slice(0, 3)} ${digits.slice(
      3,
      6,
    )} ${digits.slice(6, 9)}`;
  }

  return formatted.trim();
};

/**
 * Input Component
 */
export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  autoFormat = 'none',
  error,
  icon,
  iconRight,
  showClearButton = true,
  size = 'large',
  containerStyle,
  inputStyle,
  label,
  labelStyle,
  helperText,
  disabled = false,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = useSharedValue(Colors.border);

  // Animate border color on focus
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      borderColor: borderColor.value,
    };
  });

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    borderColor.value = withTiming(Colors.borderFocus, {
      duration: AnimationDuration.fast,
    });
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    borderColor.value = withTiming(
      error ? Colors.error : Colors.border,
      {
        duration: AnimationDuration.fast,
      },
    );
  };

  // Handle text change with auto-formatting
  const handleChangeText = (text: string) => {
    if (autoFormat === 'phone') {
      const formatted = formatPhoneNumber(text);
      onChangeText(formatted);
    } else {
      onChangeText(text);
    }
  };

  // Handle clear
  const handleClear = () => {
    onChangeText('');
  };

  // Get input height based on size
  const getInputHeight = () => {
    switch (size) {
      case 'small':
        return ComponentSizes.input.small;
      case 'medium':
        return ComponentSizes.input.medium;
      case 'large':
        return ComponentSizes.input.large;
      default:
        return ComponentSizes.input.large;
    }
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
        </Text>
      )}

      {/* Input Container */}
      <Animated.View
        style={[
          styles.container,
          {
            height: getInputHeight(),
            borderColor: error ? Colors.error : Colors.border,
          },
          animatedContainerStyle,
        ]}>
        {/* Left Icon */}
        {icon && <View style={styles.iconLeft}>{icon}</View>}

        {/* Text Input */}
        <TextInput
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          style={[
            styles.input,
            {fontSize: Typography.sizes.base},
            inputStyle,
            disabled && styles.inputDisabled,
          ]}
          {...textInputProps}
        />

        {/* Clear Button */}
        {showClearButton && value.length > 0 && !disabled && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            hitSlop={{top: 10, right: 10, bottom: 10, left: 10}}>
            <Icon name="close-circle" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}

        {/* Right Icon */}
        {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
      </Animated.View>

      {/* Helper Text / Error Message */}
      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            error && styles.errorText,
          ]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontWeight: Typography.weights.regular,
  },
  inputDisabled: {
    color: Colors.textDisabled,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  clearButton: {
    marginLeft: Spacing.xs,
  },
  helperText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  errorText: {
    color: Colors.error,
  },
});

export default Input;
