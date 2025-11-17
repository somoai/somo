/**
 * Avatar Preview Component
 *
 * Simple avatar preview for gender selection.
 * Shows different emoji/icon based on selected gender.
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors, BorderRadius, Spacing} from '@constants/theme';

export interface AvatarPreviewProps {
  /**
   * Selected gender
   */
  gender: 'boy' | 'girl' | 'other' | null;

  /**
   * Avatar size
   * @default 120
   */
  size?: number;
}

/**
 * Avatar Preview Component
 */
const AvatarPreview: React.FC<AvatarPreviewProps> = ({
  gender,
  size = 120,
}) => {
  // Get avatar emoji based on gender
  const getAvatarEmoji = () => {
    switch (gender) {
      case 'boy':
        return '👦🏾';
      case 'girl':
        return '👧🏾';
      case 'other':
        return '🧑🏾';
      default:
        return '👤';
    }
  };

  // Get background color based on gender
  const getBackgroundColor = () => {
    switch (gender) {
      case 'boy':
        return '#E3F2FD'; // Light blue
      case 'girl':
        return '#FCE4EC'; // Light pink
      case 'other':
        return '#F3E5F5'; // Light purple
      default:
        return Colors.backgroundSecondary;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <Text style={[styles.emoji, {fontSize: size * 0.5}]}>
        {getAvatarEmoji()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.white,
    shadowColor: Colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emoji: {
    textAlign: 'center',
  },
});

export default AvatarPreview;
