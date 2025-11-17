/**
 * SomoAI API Service
 *
 * Comprehensive API client with:
 * - JWT authentication with automatic token refresh
 * - Offline request queuing
 * - Network error handling
 * - TypeScript type safety
 * - Request/response logging
 */

import axios, {
  AxiosInstance,
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import DeviceInfo from 'react-native-device-info';
import {API_CONFIG, OFFLINE_CONFIG} from '@constants/config';
import StorageService from './storage';
import NetworkMonitor from './networkMonitor';
import {APIError, APIErrorCode} from './apiErrors';
import type {
  // Auth types
  OTPRequest,
  OTPResponse,
  OTPVerifyRequest,
  OTPVerifyResponse,
  RegistrationData,
  RegistrationResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  AuthTokens,
  // Student types
  Student,
  // Learning types
  NextLessonRequest,
  NextLessonResponse,
  LessonSequenceRequest,
  LessonSequenceResponse,
  StartLessonRequest,
  StartLessonResponse,
  SubmitLessonRequest,
  SubmitLessonResponse,
  Progress,
  Concept,
  // Content types
  Subject,
  Lesson,
  Answer,
} from '@types/api';

/**
 * Queued request for offline retry
 */
interface QueuedRequest {
  id: string;
  config: AxiosRequestConfig;
  timestamp: number;
  retryCount: number;
}

/**
 * API Service Class
 */
class APIService {
  private client: AxiosInstance;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];
  private offlineQueue: QueuedRequest[] = [];
  private deviceId: string = '';

  constructor() {
    // Create Axios instance
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Initialize
    this.initialize();
  }

  /**
   * Initialize API service
   */
  private async initialize(): Promise<void> {
    // Get device ID
    this.deviceId = await DeviceInfo.getUniqueId();

    // Load offline queue from storage
    this.offlineQueue = await StorageService.getOfflineQueue();

    // Setup interceptors
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();

    // Monitor network changes
    NetworkMonitor.onConnectivityChange(state => {
      if (state.isConnected && state.isInternetReachable) {
        this.processOfflineQueue();
      }
    });
  }

  /**
   * Setup request interceptor
   */
  private setupRequestInterceptor(): void {
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Add device ID
        config.headers['X-Device-ID'] = this.deviceId;

        // Add app version
        const appVersion = DeviceInfo.getVersion();
        config.headers['X-App-Version'] = appVersion;

        // Add JWT token if available
        const tokens = await StorageService.getTokens();
        if (tokens?.access) {
          config.headers.Authorization = `Bearer ${tokens.access}`;
        }

        // Log request in development
        if (__DEV__) {
          console.log('📤 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data,
          });
        }

        return config;
      },
      error => {
        return Promise.reject(error);
      },
    );
  }

  /**
   * Setup response interceptor
   */
  private setupResponseInterceptor(): void {
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (__DEV__) {
          console.log('📥 API Response:', {
            url: response.config.url,
            status: response.status,
            data: response.data,
          });
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle token refresh on 401
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for token refresh to complete
            return new Promise((resolve, reject) => {
              this.failedQueue.push({resolve, reject});
            })
              .then(() => {
                return this.client(originalRequest);
              })
              .catch(err => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const tokens = await StorageService.getTokens();
            if (tokens?.refresh) {
              const newTokens = await this.refreshToken(tokens.refresh);
              await StorageService.saveTokens(newTokens);

              // Retry failed requests
              this.processFailedQueue(null);

              // Retry original request
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            this.processFailedQueue(refreshError);
            await this.handleAuthError();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle other errors
        return Promise.reject(this.handleError(error));
      },
    );
  }

  /**
   * Process failed request queue after token refresh
   */
  private processFailedQueue(error: any): void {
    this.failedQueue.forEach(promise => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve();
      }
    });

    this.failedQueue = [];
  }

  /**
   * Handle authentication error (logout user)
   */
  private async handleAuthError(): Promise<void> {
    await StorageService.clearAllAppData();
    // TODO: Navigate to login screen
    // navigationRef.reset({ index: 0, routes: [{ name: 'Auth' }] });
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError): APIError {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 400:
          return new APIError(
            APIErrorCode.VALIDATION_ERROR,
            'Validation error',
            data.message || 'Please check your input',
            status,
            data.errors,
          );

        case 401:
          return new APIError(
            APIErrorCode.UNAUTHORIZED,
            'Unauthorized',
            undefined,
            status,
          );

        case 403:
          return new APIError(
            APIErrorCode.FORBIDDEN,
            'Forbidden',
            undefined,
            status,
          );

        case 404:
          return new APIError(
            APIErrorCode.NOT_FOUND,
            'Resource not found',
            undefined,
            status,
          );

        case 500:
          return new APIError(
            APIErrorCode.SERVER_ERROR,
            'Server error',
            undefined,
            status,
          );

        case 503:
          return new APIError(
            APIErrorCode.SERVICE_UNAVAILABLE,
            'Service unavailable',
            undefined,
            status,
          );

        default:
          return new APIError(
            APIErrorCode.UNKNOWN_ERROR,
            error.message,
            undefined,
            status,
          );
      }
    } else if (error.request) {
      // Request made but no response
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return new APIError(APIErrorCode.TIMEOUT, 'Request timeout');
      }

      return new APIError(
        APIErrorCode.NETWORK_ERROR,
        'Network error',
        undefined,
        undefined,
        error,
      );
    } else {
      // Something else happened
      return new APIError(APIErrorCode.UNKNOWN_ERROR, error.message);
    }
  }

  /**
   * Queue request for offline retry
   */
  private async queueRequest(config: AxiosRequestConfig): Promise<void> {
    if (this.offlineQueue.length >= OFFLINE_CONFIG.MAX_QUEUE_SIZE) {
      // Remove oldest request
      this.offlineQueue.shift();
    }

    const queuedRequest: QueuedRequest = {
      id: `${Date.now()}-${Math.random()}`,
      config,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.offlineQueue.push(queuedRequest);
    await StorageService.saveOfflineQueue(this.offlineQueue);
  }

  /**
   * Process offline queue when back online
   */
  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) {
      return;
    }

    console.log(`Processing ${this.offlineQueue.length} queued requests...`);

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const request of queue) {
      try {
        await this.client(request.config);
        console.log('✅ Queued request successful:', request.id);
      } catch (error) {
        console.log('❌ Queued request failed:', request.id);

        // Re-queue if retriable
        if (request.retryCount < API_CONFIG.RETRY_ATTEMPTS) {
          request.retryCount++;
          this.offlineQueue.push(request);
        }
      }
    }

    await StorageService.saveOfflineQueue(this.offlineQueue);
  }

  // ============================================================================
  // Authentication API
  // ============================================================================

  /**
   * Request OTP for phone verification
   *
   * @param phoneNumber Kenyan phone number (+254...)
   * @returns OTP request response
   *
   * @example
   * const response = await api.auth.requestOTP('+254712345678');
   * console.log(`OTP sent, expires in ${response.expires_in_minutes} minutes`);
   */
  async requestOTP(phoneNumber: string): Promise<OTPResponse> {
    const response = await this.client.post<OTPResponse>(
      '/api/auth/request-otp/',
      {phone_number: phoneNumber},
    );
    return response.data;
  }

  /**
   * Verify OTP code
   *
   * @param phoneNumber Phone number
   * @param otpCode 6-digit OTP code
   * @returns Verification response with tokens (existing user) or otp_id (new user)
   *
   * @example
   * const result = await api.auth.verifyOTP('+254712345678', '123456');
   * if (result.is_new_user) {
   *   // Navigate to registration
   * } else {
   *   // Save tokens and navigate to home
   *   await StorageService.saveTokens(result.tokens!);
   * }
   */
  async verifyOTP(
    phoneNumber: string,
    otpCode: string,
  ): Promise<OTPVerifyResponse> {
    const response = await this.client.post<OTPVerifyResponse>(
      '/api/auth/verify-otp/',
      {phone_number: phoneNumber, otp_code: otpCode},
    );
    return response.data;
  }

  /**
   * Register new student
   *
   * @param data Registration data
   * @returns Registration response with tokens and student profile
   *
   * @example
   * const result = await api.auth.register({
   *   phone_number: '+254712345678',
   *   otp_id: 'uuid-from-verify',
   *   name: 'Alice Wanjiru',
   *   grade_level: 4,
   *   language: 'en',
   * });
   * await StorageService.saveTokens(result.tokens);
   * await StorageService.saveStudent(result.student);
   */
  async register(data: RegistrationData): Promise<RegistrationResponse> {
    const response = await this.client.post<RegistrationResponse>(
      '/api/auth/register/',
      data,
    );
    return response.data;
  }

  /**
   * Refresh access token
   *
   * @param refreshToken Refresh token
   * @returns New access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await this.client.post<{access: string}>(
      '/api/auth/token/refresh/',
      {refresh: refreshToken},
    );

    return {
      access: response.data.access,
      refresh: refreshToken, // Keep existing refresh token
    };
  }

  // ============================================================================
  // Student API
  // ============================================================================

  /**
   * Get current student profile
   *
   * @returns Student profile
   *
   * @example
   * const profile = await api.student.getProfile();
   * console.log(`Welcome ${profile.name}!`);
   */
  async getProfile(): Promise<Student> {
    const response = await this.client.get<Student>('/api/auth/test/');
    return response.data;
  }

  /**
   * Update student profile
   *
   * @param data Partial student data to update
   * @returns Updated student profile
   */
  async updateProfile(data: Partial<Student>): Promise<Student> {
    const student = await StorageService.getStudent();
    if (!student) {
      throw new APIError(
        APIErrorCode.UNAUTHORIZED,
        'No student profile found',
      );
    }

    const response = await this.client.patch<Student>(
      `/api/students/${student.id}/`,
      data,
    );
    return response.data;
  }

  // ============================================================================
  // Learning API
  // ============================================================================

  /**
   * Get next recommended lesson
   *
   * @param subject Optional subject filter (MATH, ENG, SCI)
   * @returns Lesson recommendation
   *
   * @example
   * const recommendation = await api.learning.getNextLesson('MATH');
   * if (recommendation.lesson) {
   *   console.log(`Next lesson: ${recommendation.lesson.title}`);
   * }
   */
  async getNextLesson(subject?: string): Promise<NextLessonResponse> {
    const student = await StorageService.getStudent();
    if (!student) {
      throw new APIError(
        APIErrorCode.UNAUTHORIZED,
        'No student profile found',
      );
    }

    const params: any = {student_id: student.id};
    if (subject) {
      params.subject = subject;
    }

    const response = await this.client.get<NextLessonResponse>(
      '/api/learning/next_lesson/',
      {params},
    );
    return response.data;
  }

  /**
   * Get lesson sequence recommendations
   *
   * @param count Number of lessons to recommend
   * @param subject Optional subject filter
   * @returns Array of lesson recommendations
   */
  async getLessonSequence(
    count: number = 5,
    subject?: string,
  ): Promise<Lesson[]> {
    const student = await StorageService.getStudent();
    if (!student) {
      throw new APIError(
        APIErrorCode.UNAUTHORIZED,
        'No student profile found',
      );
    }

    const params: any = {student_id: student.id, count};
    if (subject) {
      params.subject = subject;
    }

    const response = await this.client.get<{lessons: Lesson[]}>(
      '/api/learning/lesson_sequence/',
      {params},
    );
    return response.data.lessons;
  }

  /**
   * Start a lesson
   *
   * @param lessonId Lesson ID
   * @returns Lesson attempt with questions
   *
   * @example
   * const attempt = await api.learning.startLesson(lessonId);
   * console.log(`${attempt.questions.length} questions loaded`);
   */
  async startLesson(lessonId: string): Promise<StartLessonResponse> {
    const response = await this.client.post<StartLessonResponse>(
      `/api/lessons/${lessonId}/start/`,
    );
    return response.data;
  }

  /**
   * Submit lesson answers
   *
   * @param lessonId Lesson ID
   * @param answers Array of answers
   * @returns Lesson results with score and feedback
   *
   * @example
   * const result = await api.learning.submitLesson(lessonId, answers);
   * console.log(`Score: ${result.score}/${result.total_questions}`);
   */
  async submitLesson(
    lessonId: string,
    answers: Answer[],
  ): Promise<SubmitLessonResponse> {
    const response = await this.client.post<SubmitLessonResponse>(
      `/api/lessons/${lessonId}/submit/`,
      {answers},
    );
    return response.data;
  }

  /**
   * Get student progress summary
   *
   * @returns Progress summary with stats and mastery levels
   *
   * @example
   * const progress = await api.learning.getProgress();
   * console.log(`${progress.lessons_completed} lessons completed`);
   * console.log(`${progress.current_streak_days} day streak 🔥`);
   */
  async getProgress(): Promise<Progress> {
    const student = await StorageService.getStudent();
    if (!student) {
      throw new APIError(
        APIErrorCode.UNAUTHORIZED,
        'No student profile found',
      );
    }

    const response = await this.client.get<Progress>(
      '/api/learning/progress/',
      {params: {student_id: student.id}},
    );
    return response.data;
  }

  /**
   * Get due reviews (spaced repetition)
   *
   * @returns Array of concepts due for review
   */
  async getDueReviews(): Promise<Concept[]> {
    const student = await StorageService.getStudent();
    if (!student) {
      throw new APIError(
        APIErrorCode.UNAUTHORIZED,
        'No student profile found',
      );
    }

    const response = await this.client.get<{concepts: Concept[]}>(
      '/api/learning/due_reviews/',
      {params: {student_id: student.id}},
    );
    return response.data.concepts;
  }

  // ============================================================================
  // Content API
  // ============================================================================

  /**
   * Get all subjects
   *
   * @returns Array of subjects
   */
  async getSubjects(): Promise<Subject[]> {
    const response = await this.client.get<Subject[]>('/api/subjects/');
    return response.data;
  }

  /**
   * Get lesson by ID
   *
   * @param lessonId Lesson ID
   * @returns Lesson details
   */
  async getLesson(lessonId: string): Promise<Lesson> {
    const response = await this.client.get<Lesson>(`/api/lessons/${lessonId}/`);
    return response.data;
  }
}

// Export singleton instance
export default new APIService();
