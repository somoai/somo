/**
 * Simple Illustration Component
 *
 * Emoji-based illustration for onboarding screens.
 * Lightweight and doesn't require additional image assets.
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from '@constants/theme';

export interface SimpleIllustrationProps {
  /**
   * Emoji to display
   */
  emoji: string;

  /**
   * Size of the illustration
   * @default 120
   */
  size?: number;

  /**
   * Background color
   * @default Colors.primarySubtle
   */
  backgroundColor?: string;
}

/**
 * Simple Illustration Component
 */
const SimpleIllustration: React.FC<SimpleIllustrationProps> = ({
  emoji,
  size = 120,
  backgroundColor = Colors.primarySubtle,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      <Text style={[styles.emoji, {fontSize: size * 0.5}]}>{emoji}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    textAlign: 'center',
  },
});

export default SimpleIllustration;
