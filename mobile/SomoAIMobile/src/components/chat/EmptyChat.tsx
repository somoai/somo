/**
 * Empty Chat Component
 *
 * Displays when no messages in conversation with:
 * - Welcome message
 * - Suggested prompts
 * - Quick start buttons
 */

import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {Colors, Typography, Spacing, BorderRadius} from '@constants/theme';

export interface EmptyChatProps {
  onSuggestionPress?: (suggestion: string) => void;
  studentName?: string;
  gradeLevel?: number;
}

/**
 * Suggested prompts for students
 */
const SUGGESTIONS = [
  {
    emoji: '📐',
    text: 'Help me with my Math homework',
    prompt: 'Can you help me understand this math problem?',
  },
  {
    emoji: '📚',
    text: 'Explain this English concept',
    prompt: 'Can you explain this English concept to me?',
  },
  {
    emoji: '🔬',
    text: 'Science question',
    prompt: 'I have a question about Science. Can you help?',
  },
  {
    emoji: '✍️',
    text: 'Check my homework',
    prompt: 'Can you check if my homework is correct?',
  },
];

/**
 * Empty Chat Component
 */
const EmptyChat: React.FC<EmptyChatProps> = ({
  onSuggestionPress,
  studentName,
  gradeLevel,
}) => {
  return (
    <View style={styles.container}>
      {/* Welcome section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.emoji}>🎓</Text>
        <Text style={styles.title}>
          Hi{studentName ? ` ${studentName}` : ''}! 👋
        </Text>
        <Text style={styles.subtitle}>
          I'm your AI tutor. Ask me anything about Math, English, Science, or Kiswahili!
        </Text>
        {gradeLevel && (
          <Text style={styles.gradeInfo}>
            You're in Grade {gradeLevel} - I'll explain things at your level
          </Text>
        )}
      </View>

      {/* Suggestions */}
      <View style={styles.suggestionsSection}>
        <Text style={styles.suggestionsTitle}>Try asking:</Text>

        <View style={styles.suggestionsGrid}>
          {SUGGESTIONS.map((suggestion, index) => (
            <Pressable
              key={index}
              style={({pressed}) => [
                styles.suggestionCard,
                pressed && styles.suggestionCardPressed,
              ]}
              onPress={() => onSuggestionPress?.(suggestion.prompt)}
              testID={`suggestion-${index}`}
            >
              <Text style={styles.suggestionEmoji}>{suggestion.emoji}</Text>
              <Text style={styles.suggestionText}>{suggestion.text}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Tips:</Text>
        <Text style={styles.tipText}>• You can upload photos of your homework</Text>
        <Text style={styles.tipText}>• Ask follow-up questions to understand better</Text>
        <Text style={styles.tipText}>• I'll guide you to the answer, not give it away</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxxl,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.base,
    paddingHorizontal: Spacing.md,
  },
  gradeInfo: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.primary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  suggestionsSection: {
    marginBottom: Spacing.xl,
  },
  suggestionsTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  suggestionCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionCardPressed: {
    backgroundColor: Colors.primarySubtle,
    borderColor: Colors.primary,
  },
  suggestionEmoji: {
    fontSize: 32,
    marginBottom: Spacing.xs,
  },
  suggestionText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  tipsSection: {
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  tipsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  tipText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.xxs,
    lineHeight: Typography.lineHeights.normal * Typography.sizes.sm,
  },
});

export default EmptyChat;
