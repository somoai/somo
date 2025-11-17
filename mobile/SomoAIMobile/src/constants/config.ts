/**
 * App Configuration Constants
 */

import {
  API_BASE_URL,
  API_TIMEOUT,
  OPENAI_API_KEY,
  ELEVENLABS_API_KEY,
  TAVUS_API_KEY,
} from '@env';

// API Configuration
export const API_CONFIG = {
  BASE_URL: API_BASE_URL || 'http://10.0.2.2:8000',
  TIMEOUT: parseInt(API_TIMEOUT || '10000', 10),
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // milliseconds
};

// Authentication
export const AUTH_CONFIG = {
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 5,
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
};

// App Settings
export const APP_CONFIG = {
  DEFAULT_LANGUAGE: 'en' as const,
  SUPPORTED_LANGUAGES: ['en', 'sw'] as const,
  MIN_GRADE_LEVEL: 1,
  MAX_GRADE_LEVEL: 8,
  DEFAULT_CHANNEL: 'app' as const,
};

// Lesson Settings
export const LESSON_CONFIG = {
  QUESTIONS_PER_LESSON: 5,
  MASTERY_THRESHOLD: 60,
  PROFICIENT_THRESHOLD: 70,
  MASTERED_THRESHOLD: 80,
};

// Progress Tracking
export const PROGRESS_CONFIG = {
  STREAK_TIMEZONE: 'Africa/Nairobi',
  RECENT_ACTIVITY_LIMIT: 10,
};

// Offline Support
export const OFFLINE_CONFIG = {
  MAX_QUEUE_SIZE: 100,
  SYNC_RETRY_INTERVAL: 30000, // 30 seconds
  CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
};

// AI Tutoring Configuration
export const AI_CONFIG = {
  // OpenAI API Configuration
  OPENAI_API_KEY: OPENAI_API_KEY || '',
  OPENAI_MODEL: 'gpt-4o-mini', // Cost-effective model for tutoring
  OPENAI_MAX_TOKENS: 1000,
  OPENAI_TEMPERATURE: 0.7,

  // Cost Tracking (in USD)
  COST_PER_1K_INPUT_TOKENS: 0.00015, // GPT-4o-mini
  COST_PER_1K_OUTPUT_TOKENS: 0.0006,  // GPT-4o-mini

  // Usage Limits by Tier
  FREE_TIER_MESSAGES_PER_DAY: 10,
  PREMIUM_TIER_MESSAGES_PER_DAY: 100,

  // Conversation Settings
  MAX_CONVERSATION_HISTORY: 20, // Last N messages to send for context
  MAX_IMAGE_SIZE_MB: 5,
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],

  // System Prompt
  SYSTEM_PROMPT: `You are a friendly and patient AI tutor for Kenyan primary school students (Grades 1-8). Your role is to:
- Help students understand Math, English, Science, and Kiswahili concepts
- Break down complex topics into simple, age-appropriate explanations
- Use examples relevant to Kenyan culture and daily life
- Encourage critical thinking with guided questions
- Provide step-by-step solutions for homework problems
- Be encouraging and positive, celebrating student progress
- Use simple language appropriate for the student's grade level
- When helping with homework, guide students to the answer rather than giving it directly

Always be patient, supportive, and culturally sensitive.`,

  // ElevenLabs Voice Tutor Configuration
  ELEVENLABS_API_KEY: ELEVENLABS_API_KEY || '',

  // Voice Tutor Settings
  VOICE_TUTOR_MAX_SESSION_DURATION: 30 * 60 * 1000, // 30 minutes
  VOICE_TUTOR_AUTO_END_INACTIVITY: 5 * 60 * 1000, // 5 minutes
  VOICE_TUTOR_COST_PER_MINUTE: 0.05, // USD
  VOICE_TUTOR_FREE_MINUTES_PER_DAY: 5,
  VOICE_TUTOR_PREMIUM_MINUTES_PER_DAY: 60,

  // Tavus Video Tutor Configuration
  TAVUS_API_KEY: TAVUS_API_KEY || '',

  // Video Tutor Settings
  VIDEO_TUTOR_MAX_SESSION_DURATION: 30 * 60 * 1000, // 30 minutes
  VIDEO_TUTOR_AUTO_END_INACTIVITY: 5 * 60 * 1000, // 5 minutes
  VIDEO_TUTOR_COST_PER_MINUTE: 2.0, // USD (Tavus pricing)
  VIDEO_TUTOR_PREMIUM_MINUTES_PER_DAY: 60,
  VIDEO_TUTOR_MIN_TIER: 'premium', // Only premium+ users
  VIDEO_QUALITY: 'hd', // 'sd' | 'hd'
  VIDEO_FRAME_RATE: 30,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKENS: '@somoai/auth_tokens',
  USER_DATA: '@somoai/user_data',
  OFFLINE_QUEUE: '@somoai/offline_queue',
  CACHED_LESSONS: '@somoai/cached_lessons',
  CACHED_PROGRESS: '@somoai/cached_progress',
  APP_SETTINGS: '@somoai/app_settings',
  CHAT_CONVERSATIONS: '@somoai/chat_conversations',
  CHAT_USAGE: '@somoai/chat_usage',
  VOICE_USAGE: '@somoai/voice_usage',
  VOICE_SESSIONS: '@somoai/voice_sessions',
  VIDEO_STATE: '@somoai/video_state',
  VIDEO_SESSIONS: '@somoai/video_sessions',
};
