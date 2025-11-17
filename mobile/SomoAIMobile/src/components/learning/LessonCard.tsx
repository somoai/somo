/**
 * Lesson Card Component
 *
 * Displays lesson information in a card format.
 * Used in Home screen and Learn screen for browsing lessons.
 */

import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {Colors, Typography, Spacing, BorderRadius, Shadows} from '@constants/theme';

interface Lesson {
  id: string;
  title: string;
  subject: string;
  description?: string;
}

export interface LessonCardProps {
  /**
   * Lesson data
   */
  lesson: Lesson;

  /**
   * Recommended difficulty level
   */
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';

  /**
   * Estimated time in minutes
   */
  estimatedTime?: number;

  /**
   * Press handler
   */
  onPress: () => void;

  /**
   * Whether lesson is completed
   * @default false
   */
  completed?: boolean;

  /**
   * Custom style
   */
  style?: any;
}

/**
 * Lesson Card Component
 */
const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  difficulty,
  estimatedTime,
  onPress,
  completed = false,
  style,
}) => {
  const difficultyConfig = {
    EASY: {color: Colors.success, label: '⭐', text: 'Easy'},
    MEDIUM: {color: Colors.warning, label: '⭐⭐', text: 'Medium'},
    HARD: {color: Colors.error, label: '⭐⭐⭐', text: 'Hard'},
  };

  const config = difficulty ? difficultyConfig[difficulty] : null;

  // Get emoji based on subject
  const getSubjectEmoji = (subject: string) => {
    const subjectMap: {[key: string]: string} = {
      MATH: '📐',
      ENGLISH: '📚',
      SCIENCE: '🔬',
      KISWAHILI: '🇰🇪',
      ART: '🎨',
      MUSIC: '🎵',
      SPORTS: '⚽',
      CODING: '💻',
      GEOGRAPHY: '🌍',
      HISTORY: '📜',
    };
    return subjectMap[subject.toUpperCase()] || '📖';
  };

  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, style]}
      accessibilityRole="button"
      accessibilityLabel={`Lesson: ${lesson.title}`}
    >
      <View style={styles.content}>
        {/* Thumbnail */}
        <View style={styles.thumbnail}>
          <Text style={styles.thumbnailEmoji}>
            {getSubjectEmoji(lesson.subject)}
          </Text>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={styles.subject}>{lesson.subject}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {lesson.title}
          </Text>

          <View style={styles.meta}>
            {estimatedTime && (
              <Text style={styles.metaText}>⏱️ {estimatedTime} min</Text>
            )}
            {config && (
              <Text style={styles.metaText}>
                {config.label} {config.text}
              </Text>
            )}
          </View>
        </View>

        {/* Action */}
        <View style={styles.action}>
          {completed ? (
            <View style={styles.completedBadge}>
              <Icon name="check-circle" size={24} color={Colors.success} />
            </View>
          ) : (
            <Icon name="chevron-right" size={24} color={Colors.primary} />
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundPrimary,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    padding: Spacing.md,
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  thumbnailEmoji: {
    fontSize: 32,
  },
  details: {
    flex: 1,
  },
  subject: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    color: Colors.primary,
    textTransform: 'uppercase',
    marginBottom: Spacing.xxs,
  },
  title: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
  },
  action: {
    marginLeft: Spacing.sm,
  },
  completedBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LessonCard;
