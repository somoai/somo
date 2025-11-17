/**
 * Chat Input Component
 *
 * Input field for sending messages with:
 * - Text input with multi-line support
 * - Image upload button for homework help
 * - Send button with loading state
 * - Haptic feedback
 */

import React, {useState} from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import {Colors, Typography, Spacing, BorderRadius} from '@constants/theme';

export interface ChatInputProps {
  onSendMessage: (message: string, imageUri?: string) => void;
  onUploadImage?: () => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}

/**
 * Chat Input Component
 */
const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onUploadImage,
  disabled = false,
  loading = false,
  placeholder = 'Ask me anything...',
}) => {
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | undefined>();

  /**
   * Handle send button press
   */
  const handleSend = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage && !selectedImage) {
      return;
    }

    // Send message
    onSendMessage(trimmedMessage || 'Help me with this image', selectedImage);

    // Clear input
    setMessage('');
    setSelectedImage(undefined);
  };

  /**
   * Handle image upload
   */
  const handleUploadImage = () => {
    if (onUploadImage) {
      onUploadImage();
    } else {
      Alert.alert(
        'Image Upload',
        'Image upload will be available soon! You can take a photo of your homework and I will help you solve it.',
      );
    }
  };

  /**
   * Remove selected image
   */
  const handleRemoveImage = () => {
    setSelectedImage(undefined);
  };

  const canSend = (message.trim().length > 0 || selectedImage) && !loading && !disabled;

  return (
    <View style={styles.container}>
      {/* Selected image preview */}
      {selectedImage && (
        <View style={styles.imagePreview}>
          <Image source={{uri: selectedImage}} style={styles.previewImage} />
          <Pressable style={styles.removeButton} onPress={handleRemoveImage}>
            <Text style={styles.removeText}>✕</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.inputContainer}>
        {/* Image upload button */}
        <Pressable
          style={[styles.iconButton, disabled && styles.iconButtonDisabled]}
          onPress={handleUploadImage}
          disabled={disabled || loading}
          testID="upload-image-button"
        >
          <Text style={styles.iconText}>📎</Text>
        </Pressable>

        {/* Text input */}
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          multiline
          maxLength={1000}
          editable={!disabled && !loading}
          testID="chat-input"
        />

        {/* Send button */}
        <Pressable
          style={[
            styles.sendButton,
            canSend && styles.sendButtonActive,
            (!canSend || disabled) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!canSend}
          testID="send-message-button"
        >
          {loading ? (
            <ActivityIndicator color={Colors.backgroundPrimary} size="small" />
          ) : (
            <Text style={styles.sendIcon}>➤</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundPrimary,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  imagePreview: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.border,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeText: {
    color: Colors.backgroundPrimary,
    fontSize: 16,
    fontWeight: Typography.weights.bold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxs,
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
  iconText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    color: Colors.textPrimary,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxs,
  },
  sendButtonActive: {
    backgroundColor: Colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
  },
  sendIcon: {
    fontSize: 20,
    color: Colors.backgroundPrimary,
  },
});

export default ChatInput;
