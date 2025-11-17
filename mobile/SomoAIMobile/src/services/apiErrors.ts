/**
 * API Error Classes
 *
 * Custom error types for better error handling and user messaging.
 */

export enum APIErrorCode {
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  OFFLINE = 'OFFLINE',

  // Authentication Errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  OTP_EXPIRED = 'OTP_EXPIRED',
  OTP_INVALID = 'OTP_INVALID',
  MAX_ATTEMPTS_EXCEEDED = 'MAX_ATTEMPTS_EXCEEDED',

  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_PHONE_NUMBER = 'INVALID_PHONE_NUMBER',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // Server Errors
  SERVER_ERROR = 'SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class APIError extends Error {
  code: APIErrorCode;
  statusCode?: number;
  details?: any;
  userMessage: string;

  constructor(
    code: APIErrorCode,
    message: string,
    userMessage?: string,
    statusCode?: number,
    details?: any,
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.userMessage = userMessage || this.getDefaultUserMessage(code);

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }

  /**
   * Get user-friendly error message based on error code
   */
  private getDefaultUserMessage(code: APIErrorCode): string {
    const messages: Record<APIErrorCode, string> = {
      [APIErrorCode.NETWORK_ERROR]:
        'Unable to connect. Please check your internet connection.',
      [APIErrorCode.TIMEOUT]:
        'Request timed out. Please try again.',
      [APIErrorCode.OFFLINE]:
        'You are offline. This action will be completed when you reconnect.',
      [APIErrorCode.UNAUTHORIZED]:
        'Please log in to continue.',
      [APIErrorCode.FORBIDDEN]:
        'You do not have permission to perform this action.',
      [APIErrorCode.INVALID_CREDENTIALS]:
        'Invalid phone number or verification code.',
      [APIErrorCode.TOKEN_EXPIRED]:
        'Your session has expired. Please log in again.',
      [APIErrorCode.OTP_EXPIRED]:
        'Verification code expired. Please request a new one.',
      [APIErrorCode.OTP_INVALID]:
        'Invalid verification code. Please try again.',
      [APIErrorCode.MAX_ATTEMPTS_EXCEEDED]:
        'Too many attempts. Please request a new verification code.',
      [APIErrorCode.VALIDATION_ERROR]:
        'Please check your input and try again.',
      [APIErrorCode.INVALID_PHONE_NUMBER]:
        'Please enter a valid Kenyan phone number (+254...).',
      [APIErrorCode.MISSING_REQUIRED_FIELD]:
        'Please fill in all required fields.',
      [APIErrorCode.NOT_FOUND]:
        'The requested resource was not found.',
      [APIErrorCode.ALREADY_EXISTS]:
        'This record already exists.',
      [APIErrorCode.SERVER_ERROR]:
        'Something went wrong on our end. Please try again later.',
      [APIErrorCode.SERVICE_UNAVAILABLE]:
        'Service temporarily unavailable. Please try again later.',
      [APIErrorCode.UNKNOWN_ERROR]:
        'An unexpected error occurred. Please try again.',
    };

    return messages[code] || messages[APIErrorCode.UNKNOWN_ERROR];
  }

  /**
   * Check if error is recoverable (can retry)
   */
  isRecoverable(): boolean {
    const recoverableCodes = [
      APIErrorCode.NETWORK_ERROR,
      APIErrorCode.TIMEOUT,
      APIErrorCode.SERVICE_UNAVAILABLE,
    ];
    return recoverableCodes.includes(this.code);
  }

  /**
   * Check if error requires re-authentication
   */
  requiresAuth(): boolean {
    const authCodes = [
      APIErrorCode.UNAUTHORIZED,
      APIErrorCode.TOKEN_EXPIRED,
    ];
    return authCodes.includes(this.code);
  }
}
