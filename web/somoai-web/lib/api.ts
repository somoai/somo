import axios from 'axios';
import { API_BASE_URL } from './constants';
import type {
  AuthResponse,
  Student,
  Parent,
  Teacher,
  Progress,
  Activity,
  Lesson,
  Subject,
  Class,
  Assignment,
} from '@/types';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Authentication API
export const authAPI = {
  requestOTP: (phone_number: string) =>
    api.post<{ success: boolean; message: string }>('/auth/request-otp/', { phone_number }),

  verifyOTP: (phone_number: string, otp_code: string) =>
    api.post<AuthResponse>('/auth/verify-otp/', { phone_number, otp_code }),

  register: (data: {
    phone_number: string;
    otp_id: string;
    name: string;
    grade_level: number;
    language?: string;
  }) =>
    api.post<AuthResponse>('/auth/register/', data),

  logout: () =>
    api.post('/auth/logout/'),
};

// Parent API
export const parentAPI = {
  getProfile: () =>
    api.get<Parent>('/parent/profile/'),

  getChildren: () =>
    api.get<Student[]>('/parent/children/'),

  getChild: (childId: string) =>
    api.get<Student>(`/parent/children/${childId}/`),

  getChildProgress: (childId: string) =>
    api.get<Progress[]>(`/parent/children/${childId}/progress/`),

  getChildActivities: (childId: string) =>
    api.get<Activity[]>(`/parent/children/${childId}/activities/`),

  updateChild: (childId: string, data: Partial<Student>) =>
    api.patch<Student>(`/parent/children/${childId}/`, data),

  addChild: (data: { phone_number: string; name: string; grade_level: number }) =>
    api.post<Student>('/parent/children/', data),
};

// Teacher API
export const teacherAPI = {
  getProfile: () =>
    api.get<Teacher>('/teacher/profile/'),

  getClasses: () =>
    api.get<Class[]>('/teacher/classes/'),

  getClass: (classId: string) =>
    api.get<Class>(`/teacher/classes/${classId}/`),

  createClass: (data: { name: string; grade_level: number; subjects: string[] }) =>
    api.post<Class>('/teacher/classes/', data),

  getStudents: (classId?: string) =>
    api.get<Student[]>('/teacher/students/', { params: { class: classId } }),

  getStudent: (studentId: string) =>
    api.get<Student>(`/teacher/students/${studentId}/`),

  getStudentProgress: (studentId: string) =>
    api.get<Progress[]>(`/teacher/students/${studentId}/progress/`),

  assignLesson: (data: {
    class_id?: string;
    student_ids?: string[];
    lesson_id: string;
    title: string;
    due_date?: string;
  }) =>
    api.post<Assignment>('/teacher/assignments/', data),

  getAssignments: (classId?: string) =>
    api.get<Assignment[]>('/teacher/assignments/', { params: { class: classId } }),
};

// Student API
export const studentAPI = {
  getStudent: (studentId: string) =>
    api.get<Student>(`/students/${studentId}/`),

  getProgress: (studentId: string) =>
    api.get<Progress[]>(`/students/${studentId}/progress/`),

  getLessons: (studentId: string, filters?: { subject?: string; grade?: number }) =>
    api.get<Lesson[]>(`/students/${studentId}/lessons/`, { params: filters }),

  getActivities: (studentId: string) =>
    api.get<Activity[]>(`/students/${studentId}/activities/`),

  updateSettings: (studentId: string, settings: Record<string, any>) =>
    api.patch<Student>(`/students/${studentId}/`, { settings }),
};

// Content API
export const contentAPI = {
  getSubjects: () =>
    api.get<Subject[]>('/subjects/'),

  getSubject: (subjectId: string) =>
    api.get<Subject>(`/subjects/${subjectId}/`),

  getLessons: (filters?: { subject?: string; grade?: number }) =>
    api.get<Lesson[]>('/lessons/', { params: filters }),

  getLesson: (lessonId: string) =>
    api.get<Lesson>(`/lessons/${lessonId}/`),
};
