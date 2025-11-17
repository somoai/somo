/**
 * Selectable Card Component
 *
 * Interactive card component with selection state:
 * - Visual feedback on selection
 * - Animated border and scale
 * - Checkmark indicator
 * - Haptic feedback
 * - Optional icon and description
 */

import React, {useEffect} from 'react';
import {
  Pressable,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  Colors,
  Typography,
  BorderRadius,
  Spacing,
  Shadows,
} from '@constants/theme';

export interface SelectableCardProps {
  /**
   * Card title
   */
  title: string;

  /**
   * Optional description
   */
  description?: string;

  /**
   * Optional icon element
   */
  icon?: React.ReactNode;

  /**
   * Whether the card is selected
   * @default false
   */
  selected?: boolean;

  /**
   * Press handler
   */
  onPress: () => void;

  /**
   * Custom style
   */
  style?: ViewStyle;

  /**
   * Whether the card is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Selectable Card Component
 */
const SelectableCard: React.FC<SelectableCardProps> = ({
  title,
  description,
  icon,
  selected = false,
  onPress,
  style,
  disabled = false,
  testID,
}) => {
  const scale = useSharedValue(1);
  const borderColor = useSharedValue(selected ? Colors.primary : Colors.border);

  // Animate border color when selection changes
  useEffect(() => {
    borderColor.value = withTiming(
      selected ? Colors.primary : Colors.border,
      {duration: 200}
    );
  }, [selected]);

  // Handle press with animation and haptic feedback
  const handlePress = () => {
    if (disabled) return;

    // Haptic feedback
    ReactNativeHapticFeedback.trigger('selection', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });

    // Scale animation
    scale.value = withSequence(
      withTiming(0.98, {duration: 100}),
      withTiming(1, {duration: 100})
    );

    onPress();
  };

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    borderColor: borderColor.value,
  }));

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{selected, disabled}}
      accessibilityLabel={`${title}${description ? `, ${description}` : ''}`}
    >
      <Animated.View
        style={[
          styles.container,
          selected && styles.selected,
          disabled && styles.disabled,
          animatedStyle,
          style,
        ]}
      >
        {/* Icon (if provided) */}
        {icon && <View style={styles.iconContainer}>{icon}</View>}

        {/* Text content */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, selected && styles.titleSelected]}>
            {title}
          </Text>
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
        </View>

        {/* Checkmark (when selected) */}
        {selected && (
          <View style={styles.checkmarkContainer}>
            <Icon name="check-circle" size={24} color={Colors.primary} />
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundPrimary,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    minHeight: 72,
    ...Shadows.sm,
  },
  selected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primarySubtle,
    ...Shadows.md,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  titleSelected: {
    color: Colors.primary,
  },
  description: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  checkmarkContainer: {
    marginLeft: Spacing.sm,
  },
});

export default SelectableCard;
