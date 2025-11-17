/**
 * ProgressBar Component
 *
 * Segmented progress indicator showing current step in a multi-step process.
 * Features smooth animations and customizable colors.
 *
 * @example
 * ```tsx
 * <ProgressBar
 *   currentStep={2}
 *   totalSteps={6}
 *   color={Colors.primary}
 * />
 * ```
 */

import React, {useEffect} from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {Colors, Spacing, BorderRadius, AnimationDuration} from '@constants/theme';

export interface ProgressBarProps {
  /**
   * Current step (1-indexed)
   */
  currentStep: number;

  /**
   * Total number of steps
   */
  totalSteps: number;

  /**
   * Progress bar color
   * @default Colors.primary
   */
  color?: string;

  /**
   * Background color (unfilled segments)
   * @default '#E5E7EB'
   */
  backgroundColor?: string;

  /**
   * Segment height
   * @default 4
   */
  height?: number;

  /**
   * Gap between segments
   * @default 4
   */
  gap?: number;

  /**
   * Custom container style
   */
  style?: ViewStyle;

  /**
   * Show animation
   * @default true
   */
  animated?: boolean;
}

/**
 * ProgressBar Component
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
  color = Colors.primary,
  backgroundColor = Colors.border,
  height = 4,
  gap = 4,
  style,
  animated = true,
}) => {
  // Validation
  const validCurrentStep = Math.max(1, Math.min(currentStep, totalSteps));

  // Generate segments
  const segments = Array.from({length: totalSteps}, (_, index) => {
    const stepNumber = index + 1;
    const isFilled = stepNumber <= validCurrentStep;
    return {stepNumber, isFilled};
  });

  return (
    <View style={[styles.container, style]}>
      {segments.map((segment, index) => (
        <ProgressSegment
          key={segment.stepNumber}
          filled={segment.isFilled}
          color={color}
          backgroundColor={backgroundColor}
          height={height}
          animated={animated}
          delay={animated ? index * 50 : 0}
          style={{marginLeft: index > 0 ? gap : 0}}
        />
      ))}
    </View>
  );
};

/**
 * Individual progress segment
 */
interface ProgressSegmentProps {
  filled: boolean;
  color: string;
  backgroundColor: string;
  height: number;
  animated: boolean;
  delay: number;
  style?: ViewStyle;
}

const ProgressSegment: React.FC<ProgressSegmentProps> = ({
  filled,
  color,
  backgroundColor,
  height,
  animated,
  delay,
  style,
}) => {
  const scale = useSharedValue(filled ? 1 : 0.5);
  const opacity = useSharedValue(filled ? 1 : 0.3);

  // Animate on fill change
  useEffect(() => {
    if (animated) {
      scale.value = withSpring(
        filled ? 1 : 0.5,
        {
          damping: 15,
          stiffness: 200,
        },
      );

      opacity.value = withTiming(
        filled ? 1 : 0.3,
        {
          duration: AnimationDuration.normal,
        },
      );
    } else {
      scale.value = filled ? 1 : 0.5;
      opacity.value = filled ? 1 : 0.3;
    }
  }, [filled, animated, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{scaleX: scale.value}],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.segment,
        {
          height,
          backgroundColor: filled ? color : backgroundColor,
        },
        animated && animatedStyle,
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  segment: {
    flex: 1,
    borderRadius: BorderRadius.xs,
  },
});

export default ProgressBar;
