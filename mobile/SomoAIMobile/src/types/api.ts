/**
 * API Type Definitions for SomoAI Mobile App
 *
 * Defines TypeScript interfaces for all API requests, responses, and data models.
 * Ensures type safety across the application.
 */

// ============================================================================
// Student & Authentication
// ============================================================================

export interface Student {
  id: string;
  phone_number: string;
  name: string;
  grade_level: number;
  school: string | null;
  subscription_tier: 'free' | 'basic' | 'premium';
  preferred_channel: 'sms' | 'ussd' | 'app';
  language: 'en' | 'sw';
  is_active: boolean;
  date_joined: string;
}

export interface OTPRequest {
  phone_number: string;
}

export interface OTPVerifyRequest {
  phone_number: string;
  otp_code: string;
}

export interface RegistrationData {
  phone_number: string;
  otp_id: string;
  name: string;
  grade_level: number;
  school?: string;
  preferred_channel?: 'sms' | 'ussd' | 'app';
  language?: 'en' | 'sw';
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  phone_number: string;
  expires_in_minutes: number;
}

export interface OTPVerifyResponse {
  success: boolean;
  message: string;
  is_new_user: boolean;
  otp_id?: string;
  phone_number?: string;
  tokens?: AuthTokens;
  student?: Student;
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  tokens: AuthTokens;
  student: Student;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
}

// ============================================================================
// Content & Curriculum
// ============================================================================

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  grade_levels: number[];
}

export interface Concept {
  id: string;
  subject: string;
  name: string;
  code: string;
  grade_level: number;
  prerequisites: string[];
  learning_objectives: string[];
}

export interface Question {
  id: string;
  lesson: string;
  question_text: string;
  question_type: 'mcq' | 'fill_blank' | 'true_false';
  options: Record<string, string>; // e.g., { "A": "Option 1", "B": "Option 2" }
  correct_answer: string | string[];
  explanation: string;
  difficulty_level: number;
  order: number;
}

export interface Lesson {
  id: string;
  concept: string;
  concept_name?: string;
  title: string;
  difficulty_level: number;
  content_type: string;
  content: {
    introduction?: string;
    examples?: string[];
    practice?: string;
  };
  estimated_duration: number;
  order: number;
  is_published: boolean;
  questions?: Question[];
  questions_count?: number;
}

export interface Answer {
  question_id: string;
  answer: string | string[];
}

export interface LessonAttempt {
  id: string;
  student: string;
  lesson: string;
  lesson_title?: string;
  channel: string;
  started_at: string;
  completed_at: string | null;
  answers: Answer[];
  score: number;
  time_spent: number;
  difficulty_level: number;
}

export interface ConceptMastery {
  id: string;
  student: string;
  concept: string;
  concept_name?: string;
  mastery_level: number;
  attempts_count: number;
  last_practiced: string | null;
  next_review_date: string | null;
  spaced_repetition_box: number;
}

// ============================================================================
// Learning Engine
// ============================================================================

export interface NextLessonRequest {
  student_id: string;
  subject?: string;
}

export interface NextLessonResponse {
  lesson: Lesson | null;
  reason: string;
  priority: 'due_review' | 'fill_gap' | 'continue_sequence' | 'enrichment' | 'none';
  details: string;
}

export interface LessonSequenceRequest {
  student_id: string;
  count?: number;
  subject?: string;
}

export interface LessonSequenceResponse {
  lessons: Lesson[];
  total_count: number;
}

export interface StartLessonRequest {
  lesson_id: string;
  channel?: string;
}

export interface StartLessonResponse {
  attempt_id: string;
  lesson: Lesson;
  questions: Question[];
  started_at: string;
}

export interface SubmitLessonRequest {
  attempt_id: string;
  answers: Answer[];
}

export interface SubmitLessonResponse {
  attempt_id: string;
  score: number;
  total_questions: number;
  correct_count: number;
  time_spent: number;
  results: {
    question_id: string;
    is_correct: boolean;
    user_answer: string | string[];
    correct_answer: string | string[];
    explanation: string;
  }[];
  mastery_updated: boolean;
  new_mastery_level?: number;
}

export interface Progress {
  student_id: string;
  student_name: string;
  grade_level: number;
  lessons_completed: number;
  total_time_minutes: number;
  average_score: number;
  current_streak_days: number;
  mastery_by_subject: Record<string, {
    average_mastery: number;
    concepts_mastered: number;
    total_concepts: number;
  }>;
  mastery_distribution: {
    distribution: {
      mastered: number;
      proficient: number;
      developing: number;
      beginner: number;
    };
    total_concepts: number;
    percentages: {
      mastered: number;
      proficient: number;
      developing: number;
      beginner: number;
    };
  };
  recent_activity: {
    lesson_title: string;
    score: number;
    completed_at: string;
  }[];
}

export interface KnowledgeGap {
  concept_id: string;
  concept_name: string;
  subject_name: string;
  mastery_level: number;
  attempts_count: number;
  last_practiced: string | null;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommended_action: string;
}

// ============================================================================
// Generic API Response Types
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface APIError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
  code?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ============================================================================
// Request Config
// ============================================================================

export interface RequestConfig {
  requiresAuth?: boolean;
  retryOnFailure?: boolean;
  queueIfOffline?: boolean;
}
