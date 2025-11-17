export interface User {
  id: string;
  email?: string;
  phone_number: string;
  name: string;
  role: 'PARENT' | 'TEACHER' | 'ADMIN' | 'STUDENT';
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  phone_number: string;
  name: string;
  grade_level: number;
  school?: string;
  date_joined: string;
  is_active: boolean;
  preferred_channel: 'sms' | 'ussd' | 'app';
  language: 'en' | 'sw';
  subscription_tier: 'free' | 'basic' | 'premium';
  settings?: Record<string, any>;
}

export interface Parent {
  id: string;
  phone_number: string;
  name: string;
  email?: string;
  students: Student[];
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone_number?: string;
  school?: string;
  subjects: string[];
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  icon?: string;
  color?: string;
  grade_levels: number[];
  created_at: string;
}

export interface Concept {
  id: string;
  subject: Subject;
  name: string;
  code: string;
  description: string;
  grade_level: number;
  learning_objectives?: string[];
  prerequisites?: Concept[];
  order: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  concept: Concept;
  title: string;
  difficulty_level: number;
  content_type: 'text' | 'video' | 'interactive';
  content: Record<string, any>;
  estimated_duration: number;
  order: number;
  is_published: boolean;
  created_at: string;
}

export interface LessonAttempt {
  id: string;
  student: string;
  lesson: string;
  started_at: string;
  completed_at?: string;
  score?: number;
  time_spent: number;
  answers?: Record<string, any>;
  is_completed: boolean;
}

export interface ConceptMastery {
  id: string;
  student: string;
  concept: string;
  mastery_level: number;
  attempts_count: number;
  average_score: number;
  last_practiced: string;
  created_at: string;
  updated_at: string;
}

export interface Progress {
  student_id: string;
  subject: string;
  mastery_level: number;
  lessons_completed: number;
  total_lessons: number;
  average_score: number;
  time_spent: number;
  last_activity: string;
  concepts_mastered: number;
  total_concepts: number;
}

export interface Activity {
  id: string;
  student_id: string;
  type: 'lesson_completed' | 'achievement_unlocked' | 'streak_milestone' | 'ai_tutor_session';
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at?: string;
  progress?: number;
  total?: number;
}

export interface Class {
  id: string;
  name: string;
  grade_level: number;
  teacher_id: string;
  student_count: number;
  subjects: string[];
  created_at: string;
}

export interface Assignment {
  id: string;
  teacher_id: string;
  class_id?: string;
  student_ids?: string[];
  lesson_id: string;
  title: string;
  description?: string;
  due_date?: string;
  created_at: string;
  completed_count: number;
  total_students: number;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  is_new_user: boolean;
  tokens?: AuthTokens;
  student?: Student;
  parent?: Parent;
  teacher?: Teacher;
}

export interface DashboardStats {
  total_students: number;
  active_today: number;
  lessons_completed: number;
  average_score: number;
  total_time_spent: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}
