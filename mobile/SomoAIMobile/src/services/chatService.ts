/**
 * AI Chat Service
 *
 * Handles communication with OpenAI API for AI tutoring with:
 * - Message sending with conversation history
 * - Image upload for homework help
 * - Cost tracking and analytics
 * - Error handling
 */

import {AI_CONFIG} from '@constants/config';
import type {ChatMessage} from '@store/slices/chatSlice';

/**
 * OpenAI API message format
 */
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{type: string; text?: string; image_url?: {url: string}}>;
}

/**
 * OpenAI API response format
 */
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Chat service response
 */
export interface ChatServiceResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
  };
  cost: number;
}

/**
 * Convert base64 image to data URI
 */
const createImageDataUri = (base64: string, mimeType: string): string => {
  return `data:${mimeType};base64,${base64}`;
};

/**
 * Calculate cost from token usage
 */
const calculateCost = (inputTokens: number, outputTokens: number): number => {
  const inputCost = (inputTokens / 1000) * AI_CONFIG.COST_PER_1K_INPUT_TOKENS;
  const outputCost = (outputTokens / 1000) * AI_CONFIG.COST_PER_1K_OUTPUT_TOKENS;
  return inputCost + outputCost;
};

/**
 * Convert chat messages to OpenAI format
 */
const convertToOpenAIMessages = (
  messages: ChatMessage[],
  imageBase64?: string,
): OpenAIMessage[] => {
  const openAIMessages: OpenAIMessage[] = [];

  // Add system prompt
  openAIMessages.push({
    role: 'system',
    content: AI_CONFIG.SYSTEM_PROMPT,
  });

  // Add conversation history (limit to MAX_CONVERSATION_HISTORY)
  const recentMessages = messages.slice(-AI_CONFIG.MAX_CONVERSATION_HISTORY);

  for (const msg of recentMessages) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      // Handle message with image
      if (msg.role === 'user' && msg.imageUri && imageBase64) {
        openAIMessages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: msg.content,
            },
            {
              type: 'image_url',
              image_url: {
                url: createImageDataUri(imageBase64, 'image/jpeg'),
              },
            },
          ],
        });
      } else {
        openAIMessages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }
  }

  return openAIMessages;
};

/**
 * Send message to OpenAI API
 */
export const sendMessageToAI = async (
  conversationMessages: ChatMessage[],
  newMessage: string,
  imageBase64?: string,
  gradeLevel?: number,
): Promise<ChatServiceResponse> => {
  try {
    // Validate API key
    if (!AI_CONFIG.OPENAI_API_KEY) {
      throw new Error(
        'OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env file.',
      );
    }

    // Create messages array
    const allMessages = [
      ...conversationMessages,
      {
        id: `temp-${Date.now()}`,
        role: 'user' as const,
        content: newMessage,
        timestamp: Date.now(),
        imageUri: imageBase64 ? 'temp' : undefined,
      },
    ];

    // Convert to OpenAI format
    const openAIMessages = convertToOpenAIMessages(allMessages, imageBase64);

    // Enhance system prompt with grade level if provided
    if (gradeLevel && openAIMessages[0]?.role === 'system') {
      openAIMessages[0].content += `\n\nThe student is in Grade ${gradeLevel}. Adjust your explanations to be appropriate for this grade level.`;
    }

    // Make API request
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_CONFIG.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.OPENAI_MODEL,
        messages: openAIMessages,
        max_tokens: AI_CONFIG.OPENAI_MAX_TOKENS,
        temperature: AI_CONFIG.OPENAI_TEMPERATURE,
      }),
    });

    // Check for errors
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));

      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (response.status === 500) {
        throw new Error('OpenAI service error. Please try again later.');
      }

      throw new Error(
        error.error?.message || `OpenAI API error: ${response.status}`,
      );
    }

    const data: OpenAIResponse = await response.json();

    // Extract response
    const assistantMessage = data.choices[0]?.message?.content;
    if (!assistantMessage) {
      throw new Error('No response from AI');
    }

    // Calculate cost
    const tokensUsed = {
      input: data.usage.prompt_tokens,
      output: data.usage.completion_tokens,
    };
    const cost = calculateCost(tokensUsed.input, tokensUsed.output);

    return {
      content: assistantMessage,
      tokensUsed,
      cost,
    };
  } catch (error) {
    console.error('Chat service error:', error);

    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get AI response. Please try again.');
  }
};

/**
 * Validate image file
 */
export const validateImage = (
  uri: string,
  mimeType: string,
  sizeInBytes: number,
): {valid: boolean; error?: string} => {
  // Check mime type
  if (!AI_CONFIG.SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: 'Invalid image format. Please use JPEG or PNG.',
    };
  }

  // Check size
  const maxSizeBytes = AI_CONFIG.MAX_IMAGE_SIZE_MB * 1024 * 1024;
  if (sizeInBytes > maxSizeBytes) {
    return {
      valid: false,
      error: `Image too large. Maximum size is ${AI_CONFIG.MAX_IMAGE_SIZE_MB}MB.`,
    };
  }

  return {valid: true};
};

/**
 * Convert image URI to base64 (React Native specific)
 */
export const imageUriToBase64 = async (uri: string): Promise<string> => {
  try {
    // This would use react-native-fs or expo-file-system
    // For now, return a placeholder
    // TODO: Implement with actual file system library
    throw new Error('Image conversion not implemented yet. Install react-native-fs or expo-file-system.');
  } catch (error) {
    console.error('Image conversion error:', error);
    throw new Error('Failed to process image');
  }
};

/**
 * Generate conversation title suggestion from first message
 */
export const generateTitleFromMessage = (message: string): string => {
  const maxLength = 50;

  // Remove extra whitespace
  const cleaned = message.trim().replace(/\s+/g, ' ');

  // Truncate if too long
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Try to break at word boundary
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.7) {
    // Good breaking point found
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
};

export default {
  sendMessageToAI,
  validateImage,
  imageUriToBase64,
  generateTitleFromMessage,
};
