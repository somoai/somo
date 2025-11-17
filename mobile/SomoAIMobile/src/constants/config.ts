/**
 * App Configuration Constants
 */

import {API_BASE_URL, API_TIMEOUT} from '@env';

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

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKENS: '@somoai/auth_tokens',
  USER_DATA: '@somoai/user_data',
  OFFLINE_QUEUE: '@somoai/offline_queue',
  CACHED_LESSONS: '@somoai/cached_lessons',
  CACHED_PROGRESS: '@somoai/cached_progress',
  APP_SETTINGS: '@somoai/app_settings',
};
