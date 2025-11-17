/**
 * Message Bubble Component
 *
 * Displays individual chat messages with:
 * - Different styles for user vs assistant
 * - Image support for homework help
 * - Timestamp display
 * - Smooth animations
 */

import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Image, Animated} from 'react-native';
import type {ChatMessage} from '@store/slices/chatSlice';
import {Colors, Typography, Spacing, BorderRadius} from '@constants/theme';

export interface MessageBubbleProps {
  message: ChatMessage;
  showTimestamp?: boolean;
}

/**
 * Format timestamp to readable time
 */
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
};

/**
 * Message Bubble Component
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showTimestamp = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  useEffect(() => {
    // Animate message entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Don't render system messages
  if (message.role === 'system') {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        isUser && styles.containerUser,
        {
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        },
      ]}
      testID={`message-bubble-${message.role}`}
    >
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {/* Avatar for assistant */}
        {isAssistant && (
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🤖</Text>
          </View>
        )}

        <View style={styles.contentContainer}>
          {/* Image if present */}
          {message.imageUri && (
            <Image
              source={{uri: message.imageUri}}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          {/* Message text */}
          <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
            {message.content}
          </Text>

          {/* Timestamp */}
          {showTimestamp && (
            <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
              {formatTime(message.timestamp)}
            </Text>
          )}

          {/* Cost info (for development/analytics) */}
          {__DEV__ && message.cost && (
            <Text style={styles.costInfo}>
              ${message.cost.toFixed(4)} • {message.tokensUsed?.input || 0}↓ / {message.tokensUsed?.output || 0}↑
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    alignItems: 'flex-start',
  },
  containerUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    flexDirection: 'row',
    maxWidth: '85%',
    gap: Spacing.sm,
  },
  bubbleUser: {
    flexDirection: 'row-reverse',
  },
  bubbleAssistant: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primarySubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  avatarEmoji: {
    fontSize: 18,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.border,
  },
  text: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    lineHeight: Typography.lineHeights.relaxed * Typography.sizes.base,
  },
  textUser: {
    color: Colors.backgroundPrimary,
  },
  textAssistant: {
    color: Colors.textPrimary,
  },
  timestamp: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  timestampUser: {
    color: Colors.backgroundPrimary,
    opacity: 0.7,
  },
  costInfo: {
    fontSize: Typography.sizes.xxs,
    fontWeight: Typography.weights.regular,
    color: Colors.textTertiary,
    marginTop: Spacing.xxs,
  },
});

// Update user message style to have primary background
const updatedStyles = StyleSheet.create({
  ...styles,
  contentContainer: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
});

// Override for user messages
const MessageBubbleWithUserStyle: React.FC<MessageBubbleProps> = (props) => {
  const isUser = props.message.role === 'user';

  return (
    <Animated.View
      style={[
        styles.container,
        isUser && styles.containerUser,
      ]}
      testID={`message-bubble-${props.message.role}`}
    >
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {/* Avatar for assistant */}
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🤖</Text>
          </View>
        )}

        <View
          style={[
            updatedStyles.contentContainer,
            {backgroundColor: isUser ? Colors.primary : Colors.backgroundSecondary},
          ]}
        >
          {/* Image if present */}
          {props.message.imageUri && (
            <Image
              source={{uri: props.message.imageUri}}
              style={styles.image}
              resizeMode="cover"
            />
          )}

          {/* Message text */}
          <Text style={[styles.text, isUser ? styles.textUser : styles.textAssistant]}>
            {props.message.content}
          </Text>

          {/* Timestamp */}
          {props.showTimestamp && (
            <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
              {formatTime(props.message.timestamp)}
            </Text>
          )}

          {/* Cost info (for development/analytics) */}
          {__DEV__ && props.message.cost && (
            <Text style={styles.costInfo}>
              ${props.message.cost.toFixed(4)} • {props.message.tokensUsed?.input || 0}↓ /{' '}
              {props.message.tokensUsed?.output || 0}↑
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

export default MessageBubbleWithUserStyle;
