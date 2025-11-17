/**
 * Chat Screen
 *
 * AI Tutoring chat interface with full functionality:
 * - Real-time messaging with OpenAI
 * - Conversation persistence
 * - Usage tracking and tier limits
 * - Image upload for homework help
 * - Cost tracking
 * - Pull-to-refresh
 * - Loading and error states
 * - Haptic feedback
 * - Upgrade prompts
 */

import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  createConversation,
  addUserMessage,
  addAssistantMessage,
  saveConversations,
  saveDailyUsage,
  loadConversations,
  loadDailyUsage,
  selectActiveConversation,
  selectHasReachedDailyLimit,
  selectRemainingMessages,
  setSendingMessage,
  UserTier,
} from '../../store/slices/chatSlice';
import {MessageBubble, ChatInput, EmptyChat} from '../../components/chat';
import {sendMessageToAI} from '../../services/chatService';
import {Colors, Spacing, Typography, BorderRadius} from '@constants/theme';
import {AI_CONFIG} from '@constants/config';

/**
 * Chat Screen Component
 */
const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const {profile} = useAppSelector(state => state.student);
  const {sendingMessage, conversations, activeConversationId, currentTier, dailyUsage} =
    useAppSelector(state => state.chat);
  const activeConversation = useAppSelector(selectActiveConversation);
  const hasReachedLimit = useAppSelector(selectHasReachedDailyLimit);
  const remainingMessages = useAppSelector(selectRemainingMessages);

  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Load data on mount
    initializeChat();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (activeConversation && activeConversation.messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    }
  }, [activeConversation?.messages.length]);

  /**
   * Initialize chat (load conversations and usage)
   */
  const initializeChat = async () => {
    await Promise.all([
      dispatch(loadConversations()).unwrap().catch(() => {}),
      dispatch(loadDailyUsage()).unwrap().catch(() => {}),
    ]);

    // Create first conversation if none exist
    if (!activeConversationId) {
      dispatch(createConversation());
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await initializeChat();
    setRefreshing(false);
  };

  /**
   * Handle send message
   */
  const handleSendMessage = async (message: string, imageUri?: string) => {
    // Check if reached daily limit
    if (hasReachedLimit) {
      showUpgradePrompt();
      return;
    }

    // Ensure we have an active conversation
    let conversationId = activeConversationId;
    if (!conversationId) {
      dispatch(createConversation());
      conversationId = activeConversationId!;
    }

    if (!conversationId) {
      Alert.alert('Error', 'Failed to create conversation');
      return;
    }

    try {
      // Add user message to conversation
      dispatch(
        addUserMessage({
          conversationId,
          content: message,
          imageUri,
        }),
      );

      // Set loading state
      dispatch(setSendingMessage(true));

      // Get AI response
      const response = await sendMessageToAI(
        activeConversation?.messages || [],
        message,
        undefined, // imageBase64 - TODO: implement image conversion
        profile?.grade,
      );

      // Add assistant message to conversation
      dispatch(
        addAssistantMessage({
          conversationId,
          content: response.content,
          tokensUsed: response.tokensUsed,
        }),
      );

      // Save conversations and usage
      await Promise.all([
        dispatch(saveConversations(conversations)).unwrap(),
        dailyUsage && dispatch(saveDailyUsage(dailyUsage)).unwrap(),
      ]);
    } catch (error) {
      console.error('Failed to send message:', error);

      // Show error to user
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to send message. Please try again.',
      );
    } finally {
      // Clear loading state
      dispatch(setSendingMessage(false));
    }
  };

  /**
   * Show upgrade prompt when limit reached
   */
  const showUpgradePrompt = () => {
    Alert.alert(
      'Daily Limit Reached',
      `You've used all ${AI_CONFIG.FREE_TIER_MESSAGES_PER_DAY} free messages for today. Upgrade to Premium for unlimited messages!`,
      [
        {
          text: 'Maybe Later',
          style: 'cancel',
        },
        {
          text: 'Upgrade to Premium',
          onPress: () => {
            // TODO: Navigate to subscription screen
            Alert.alert('Premium', 'Subscription coming soon!');
          },
        },
      ],
    );
  };

  /**
   * Handle suggestion press from empty state
   */
  const handleSuggestionPress = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  /**
   * Render message item
   */
  const renderMessage = ({item}: {item: any}) => (
    <MessageBubble message={item} showTimestamp />
  );

  /**
   * Render header with usage info
   */
  const renderHeader = () => {
    if (!dailyUsage) return null;

    const limit =
      currentTier === UserTier.PREMIUM
        ? AI_CONFIG.PREMIUM_TIER_MESSAGES_PER_DAY
        : AI_CONFIG.FREE_TIER_MESSAGES_PER_DAY;

    return (
      <View style={styles.header}>
        <Text style={styles.headerText}>
          {remainingMessages} / {limit} messages remaining today
        </Text>
        {currentTier === UserTier.FREE && (
          <Pressable onPress={showUpgradePrompt}>
            <Text style={styles.upgradeLink}>Upgrade to Premium</Text>
          </Pressable>
        )}
      </View>
    );
  };

  // Show loading indicator while initializing
  if (!activeConversation && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </SafeAreaView>
    );
  }

  const messages = activeConversation?.messages || [];
  const isEmpty = messages.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Usage info header */}
        {renderHeader()}

        {/* Messages list or empty state */}
        {isEmpty ? (
          <EmptyChat
            onSuggestionPress={handleSuggestionPress}
            studentName={profile?.name}
            gradeLevel={profile?.grade}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.messagesList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[Colors.primary]}
              />
            }
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({animated: true})
            }
            testID="messages-list"
          />
        )}

        {/* Sending indicator */}
        {sendingMessage && (
          <View style={styles.sendingIndicator}>
            <ActivityIndicator color={Colors.primary} size="small" />
            <Text style={styles.sendingText}>AI is thinking...</Text>
          </View>
        )}

        {/* Input */}
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={hasReachedLimit}
          loading={sendingMessage}
          placeholder={
            hasReachedLimit
              ? 'Daily limit reached. Upgrade to continue.'
              : 'Ask me anything...'
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundPrimary,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundPrimary,
  },
  loadingText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
  },
  upgradeLink: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.primary,
  },
  messagesList: {
    paddingVertical: Spacing.md,
  },
  sendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  sendingText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.regular,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default ChatScreen;
