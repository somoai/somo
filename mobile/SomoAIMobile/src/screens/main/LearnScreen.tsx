/**
 * Learn Screen
 *
 * Learning activities and lessons
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors, Typography} from '@constants/theme';

export default function LearnScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Learn Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  text: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
});
