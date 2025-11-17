/**
 * Progress Ring Component
 *
 * Animated circular progress indicator.
 * Used in dashboards and progress displays.
 */

import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
} from 'react-native-reanimated';
import {Colors} from '@constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  /**
   * Progress value (0-100)
   */
  progress: number;

  /**
   * Ring size
   * @default 100
   */
  size?: number;

  /**
   * Stroke width
   * @default 8
   */
  strokeWidth?: number;

  /**
   * Progress color
   * @default Colors.primary
   */
  color?: string;

  /**
   * Background color
   * @default Colors.border
   */
  backgroundColor?: string;

  /**
   * Animation duration in ms
   * @default 1000
   */
  animationDuration?: number;
}

/**
 * Progress Ring Component
 */
const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 100,
  strokeWidth = 8,
  color = Colors.primary,
  backgroundColor = Colors.border,
  animationDuration = 1000,
}) => {
  const animatedProgress = useSharedValue(0);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {duration: animationDuration});
  }, [progress, animationDuration]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset =
      circumference - (circumference * animatedProgress.value) / 100;
    return {strokeDashoffset};
  });

  return (
    <View style={[styles.container, {width: size, height: size}]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeLinecap="round"
          fill="none"
          animatedProps={animatedProps}
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProgressRing;
