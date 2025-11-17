/**
 * Chat Redux Slice
 *
 * Manages AI tutoring chat state including:
 * - Conversation history with persistence
 * - Usage tracking and tier limits
 * - Cost tracking for analytics
 * - Image upload for homework help
 * - Loading and error states
 */

import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS, AI_CONFIG} from '@constants/config';

/**
 * Message role types
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Message interface
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  imageUri?: string; // For homework help with images
  tokensUsed?: {
    input: number;
    output: number;
  };
  cost?: number; // Cost in USD
}

/**
 * Conversation interface
 */
export interface Conversation {
  id: string;
  title: string; // Auto-generated from first message
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  totalCost: number;
  totalTokens: number;
}

/**
 * Usage tracking interface
 */
export interface DailyUsage {
  date: string; // YYYY-MM-DD format
  messageCount: number;
  tokenCount: number;
  cost: number;
}

/**
 * User tier enum
 */
export enum UserTier {
  FREE = 'free',
  PREMIUM = 'premium',
}

/**
 * Chat state interface
 */
export interface ChatState {
  conversations: Record<string, Conversation>; // Keyed by conversation ID
  activeConversationId: string | null;
  currentTier: UserTier;
  dailyUsage: DailyUsage | null;
  loading: boolean;
  error: string | null;
  sendingMessage: boolean;
  uploadingImage: boolean;
}

/**
 * Initial state
 */
const initialState: ChatState = {
  conversations: {},
  activeConversationId: null,
  currentTier: UserTier.FREE,
  dailyUsage: null,
  loading: false,
  error: null,
  sendingMessage: false,
  uploadingImage: false,
};

/**
 * Helper: Generate unique ID
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Helper: Get today's date string
 */
const getTodayDateString = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
};

/**
 * Helper: Calculate message cost
 */
const calculateCost = (inputTokens: number, outputTokens: number): number => {
  const inputCost = (inputTokens / 1000) * AI_CONFIG.COST_PER_1K_INPUT_TOKENS;
  const outputCost = (outputTokens / 1000) * AI_CONFIG.COST_PER_1K_OUTPUT_TOKENS;
  return inputCost + outputCost;
};

/**
 * Helper: Generate conversation title from first message
 */
const generateConversationTitle = (firstMessage: string): string => {
  const maxLength = 50;
  if (firstMessage.length <= maxLength) {
    return firstMessage;
  }
  return firstMessage.substring(0, maxLength) + '...';
};

// ============================================================================
// Async Thunks
// ============================================================================

/**
 * Load conversations from storage
 */
export const loadConversations = createAsyncThunk(
  'chat/loadConversations',
  async (_, {rejectWithValue}) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_CONVERSATIONS);
      const conversations = stored ? JSON.parse(stored) : {};
      return conversations;
    } catch (error) {
      console.error('Failed to load conversations:', error);
      return rejectWithValue('Failed to load conversation history');
    }
  },
);

/**
 * Load daily usage from storage
 */
export const loadDailyUsage = createAsyncThunk(
  'chat/loadDailyUsage',
  async (_, {rejectWithValue}) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_USAGE);
      if (!stored) {
        return null;
      }

      const usage: DailyUsage = JSON.parse(stored);
      const today = getTodayDateString();

      // Reset if it's a new day
      if (usage.date !== today) {
        return {
          date: today,
          messageCount: 0,
          tokenCount: 0,
          cost: 0,
        };
      }

      return usage;
    } catch (error) {
      console.error('Failed to load usage:', error);
      return rejectWithValue('Failed to load usage data');
    }
  },
);

/**
 * Save conversations to storage
 */
export const saveConversations = createAsyncThunk(
  'chat/saveConversations',
  async (conversations: Record<string, Conversation>, {rejectWithValue}) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CHAT_CONVERSATIONS,
        JSON.stringify(conversations),
      );
      return conversations;
    } catch (error) {
      console.error('Failed to save conversations:', error);
      return rejectWithValue('Failed to save conversations');
    }
  },
);

/**
 * Save daily usage to storage
 */
export const saveDailyUsage = createAsyncThunk(
  'chat/saveDailyUsage',
  async (usage: DailyUsage, {rejectWithValue}) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CHAT_USAGE,
        JSON.stringify(usage),
      );
      return usage;
    } catch (error) {
      console.error('Failed to save usage:', error);
      return rejectWithValue('Failed to save usage data');
    }
  },
);

/**
 * Send message to AI (this will be handled by API service)
 * This thunk is a placeholder - actual API call will be in chatService
 */
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (
    {
      conversationId,
      message,
      imageUri,
    }: {
      conversationId: string;
      message: string;
      imageUri?: string;
    },
    {getState, dispatch, rejectWithValue},
  ) => {
    try {
      // This will be implemented in the chat service
      // For now, return a placeholder
      return {
        conversationId,
        userMessage: message,
        assistantResponse: 'AI response will be implemented',
        imageUri,
      };
    } catch (error) {
      return rejectWithValue('Failed to send message');
    }
  },
);

// ============================================================================
// Slice
// ============================================================================

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    /**
     * Create new conversation
     */
    createConversation: (state) => {
      const id = generateId();
      const now = Date.now();

      state.conversations[id] = {
        id,
        title: 'New Conversation',
        messages: [],
        createdAt: now,
        updatedAt: now,
        totalCost: 0,
        totalTokens: 0,
      };

      state.activeConversationId = id;
    },

    /**
     * Set active conversation
     */
    setActiveConversation: (state, action: PayloadAction<string>) => {
      state.activeConversationId = action.payload;
    },

    /**
     * Add user message to conversation
     */
    addUserMessage: (
      state,
      action: PayloadAction<{
        conversationId: string;
        content: string;
        imageUri?: string;
      }>,
    ) => {
      const {conversationId, content, imageUri} = action.payload;
      const conversation = state.conversations[conversationId];

      if (!conversation) return;

      const message: ChatMessage = {
        id: generateId(),
        role: 'user',
        content,
        timestamp: Date.now(),
        imageUri,
      };

      conversation.messages.push(message);
      conversation.updatedAt = Date.now();

      // Update title if this is the first message
      if (conversation.messages.length === 1) {
        conversation.title = generateConversationTitle(content);
      }
    },

    /**
     * Add assistant message to conversation
     */
    addAssistantMessage: (
      state,
      action: PayloadAction<{
        conversationId: string;
        content: string;
        tokensUsed?: {input: number; output: number};
      }>,
    ) => {
      const {conversationId, content, tokensUsed} = action.payload;
      const conversation = state.conversations[conversationId];

      if (!conversation) return;

      // Calculate cost if tokens provided
      let cost = 0;
      if (tokensUsed) {
        cost = calculateCost(tokensUsed.input, tokensUsed.output);
        conversation.totalCost += cost;
        conversation.totalTokens += tokensUsed.input + tokensUsed.output;
      }

      const message: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content,
        timestamp: Date.now(),
        tokensUsed,
        cost,
      };

      conversation.messages.push(message);
      conversation.updatedAt = Date.now();

      // Update daily usage
      if (state.dailyUsage) {
        state.dailyUsage.messageCount += 1;
        if (tokensUsed) {
          state.dailyUsage.tokenCount += tokensUsed.input + tokensUsed.output;
          state.dailyUsage.cost += cost;
        }
      }
    },

    /**
     * Delete conversation
     */
    deleteConversation: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      delete state.conversations[conversationId];

      if (state.activeConversationId === conversationId) {
        state.activeConversationId = null;
      }
    },

    /**
     * Clear all conversations
     */
    clearAllConversations: (state) => {
      state.conversations = {};
      state.activeConversationId = null;
    },

    /**
     * Set user tier
     */
    setUserTier: (state, action: PayloadAction<UserTier>) => {
      state.currentTier = action.payload;
    },

    /**
     * Initialize daily usage
     */
    initializeDailyUsage: (state) => {
      state.dailyUsage = {
        date: getTodayDateString(),
        messageCount: 0,
        tokenCount: 0,
        cost: 0,
      };
    },

    /**
     * Clear error
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Set sending message state
     */
    setSendingMessage: (state, action: PayloadAction<boolean>) => {
      state.sendingMessage = action.payload;
    },

    /**
     * Set uploading image state
     */
    setUploadingImage: (state, action: PayloadAction<boolean>) => {
      state.uploadingImage = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Load conversations
    builder
      .addCase(loadConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(loadConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Load daily usage
    builder
      .addCase(loadDailyUsage.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadDailyUsage.fulfilled, (state, action) => {
        state.loading = false;
        state.dailyUsage = action.payload;

        // Initialize if null
        if (!state.dailyUsage) {
          state.dailyUsage = {
            date: getTodayDateString(),
            messageCount: 0,
            tokenCount: 0,
            cost: 0,
          };
        }
      })
      .addCase(loadDailyUsage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Save conversations
    builder
      .addCase(saveConversations.pending, (state) => {
        // Don't set loading for background saves
      })
      .addCase(saveConversations.fulfilled, (state) => {
        // Success
      })
      .addCase(saveConversations.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Save daily usage
    builder
      .addCase(saveDailyUsage.pending, (state) => {
        // Don't set loading for background saves
      })
      .addCase(saveDailyUsage.fulfilled, (state) => {
        // Success
      })
      .addCase(saveDailyUsage.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// ============================================================================
// Exports
// ============================================================================

export const {
  createConversation,
  setActiveConversation,
  addUserMessage,
  addAssistantMessage,
  deleteConversation,
  clearAllConversations,
  setUserTier,
  initializeDailyUsage,
  clearError,
  setSendingMessage,
  setUploadingImage,
} = chatSlice.actions;

export default chatSlice.reducer;

// ============================================================================
// Selectors
// ============================================================================

/**
 * Get active conversation
 */
export const selectActiveConversation = (state: {chat: ChatState}) => {
  const {conversations, activeConversationId} = state.chat;
  if (!activeConversationId) return null;
  return conversations[activeConversationId] || null;
};

/**
 * Get all conversations sorted by updated date
 */
export const selectAllConversations = (state: {chat: ChatState}) => {
  const {conversations} = state.chat;
  return Object.values(conversations).sort(
    (a, b) => b.updatedAt - a.updatedAt,
  );
};

/**
 * Check if user has reached daily limit
 */
export const selectHasReachedDailyLimit = (state: {chat: ChatState}) => {
  const {dailyUsage, currentTier} = state.chat;
  if (!dailyUsage) return false;

  const limit =
    currentTier === UserTier.PREMIUM
      ? AI_CONFIG.PREMIUM_TIER_MESSAGES_PER_DAY
      : AI_CONFIG.FREE_TIER_MESSAGES_PER_DAY;

  return dailyUsage.messageCount >= limit;
};

/**
 * Get remaining messages for today
 */
export const selectRemainingMessages = (state: {chat: ChatState}) => {
  const {dailyUsage, currentTier} = state.chat;
  if (!dailyUsage) return 0;

  const limit =
    currentTier === UserTier.PREMIUM
      ? AI_CONFIG.PREMIUM_TIER_MESSAGES_PER_DAY
      : AI_CONFIG.FREE_TIER_MESSAGES_PER_DAY;

  return Math.max(0, limit - dailyUsage.messageCount);
};
