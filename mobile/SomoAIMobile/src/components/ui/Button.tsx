/**
 * Button Component
 *
 * Primary button component with multiple variants, sizes, and states.
 * Includes loading state, haptic feedback, and smooth animations.
 *
 * @example
 * ```tsx
 * <Button
 *   title="Continue"
 *   onPress={handleContinue}
 *   variant="primary"
 *   size="large"
 *   loading={isLoading}
 * />
 * ```
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {
  Colors,
  Typography,
  BorderRadius,
  ComponentSizes,
  Spacing,
  Shadows,
} from '@constants/theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export interface ButtonProps {
  /**
   * Button text
   */
  title: string;

  /**
   * Press handler
   */
  onPress: () => void;

  /**
   * Button variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';

  /**
   * Button size
   * @default 'large'
   */
  size?: 'small' | 'medium' | 'large';

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;

  /**
   * Loading state (shows spinner)
   * @default false
   */
  loading?: boolean;

  /**
   * Icon to display before text
   */
  icon?: React.ReactNode;

  /**
   * Icon to display after text
   */
  iconRight?: React.ReactNode;

  /**
   * Full width button
   * @default true
   */
  fullWidth?: boolean;

  /**
   * Enable haptic feedback on press
   * @default true
   */
  hapticFeedback?: boolean;

  /**
   * Custom style
   */
  style?: ViewStyle;

  /**
   * Custom text style
   */
  textStyle?: TextStyle;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Button Component
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  fullWidth = true,
  hapticFeedback = true,
  style,
  textStyle,
  testID,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Press animation
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: scale.value}],
      opacity: opacity.value,
    };
  });

  // Handle press in
  const handlePressIn = () => {
    if (disabled || loading) return;

    scale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 300,
    });

    if (hapticFeedback) {
      ReactNativeHapticFeedback.trigger('impactLight');
    }
  };

  // Handle press out
  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
  };

  // Handle press
  const handlePress = () => {
    if (disabled || loading) return;
    onPress();
  };

  // Get button styles
  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.lg,
      ...Shadows.sm,
    };

    // Size
    switch (size) {
      case 'small':
        baseStyle.height = ComponentSizes.button.small;
        baseStyle.paddingHorizontal = Spacing.base;
        break;
      case 'medium':
        baseStyle.height = ComponentSizes.button.medium;
        baseStyle.paddingHorizontal = Spacing.lg;
        break;
      case 'large':
        baseStyle.height = ComponentSizes.button.large;
        baseStyle.paddingHorizontal = Spacing.xl;
        break;
    }

    // Variant
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = Colors.primary;
        break;
      case 'secondary':
        baseStyle.backgroundColor = Colors.secondary;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = Colors.primary;
        baseStyle.shadowOpacity = 0;
        baseStyle.elevation = 0;
        break;
      case 'text':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.shadowOpacity = 0;
        baseStyle.elevation = 0;
        break;
      case 'danger':
        baseStyle.backgroundColor = Colors.error;
        break;
    }

    // Disabled
    if (disabled || loading) {
      baseStyle.opacity = 0.5;
    }

    // Full width
    if (fullWidth) {
      baseStyle.width = '100%';
    }

    return baseStyle;
  };

  // Get text styles
  const getTextStyles = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: Typography.weights.semibold,
    };

    // Size
    switch (size) {
      case 'small':
        baseStyle.fontSize = Typography.sizes.sm;
        break;
      case 'medium':
        baseStyle.fontSize = Typography.sizes.base;
        break;
      case 'large':
        baseStyle.fontSize = Typography.sizes.lg;
        break;
    }

    // Variant
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        baseStyle.color = Colors.white;
        break;
      case 'outline':
      case 'text':
        baseStyle.color = Colors.primary;
        break;
    }

    return baseStyle;
  };

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[getButtonStyles(), animatedStyle, style]}
      testID={testID}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'outline' || variant === 'text'
              ? Colors.primary
              : Colors.white
          }
        />
      ) : (
        <>
          {icon && <View style={styles.iconLeft}>{icon}</View>}

          <Text style={[getTextStyles(), textStyle]}>{title}</Text>

          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </>
      )}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});

export default Button;
