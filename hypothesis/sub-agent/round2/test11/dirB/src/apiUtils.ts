/**
 * API utilities for backend service endpoints
 */

/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Creates a successful API response
 * @param data - Response data
 * @returns Formatted success response
 */
export function createSuccessResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString()
  };
}

/**
 * Creates an error API response
 * @param error - Error message
 * @returns Formatted error response
 */
export function createErrorResponse(error: string): ApiResponse {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString()
  };
}

/**
 * Validates email format
 * @param email - Email address to validate
 * @returns True if email is valid
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates that a value is not null or undefined
 * @param value - Value to validate
 * @param fieldName - Field name for error message
 * @throws Error if value is null or undefined
 */
export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new Error(`${fieldName} is required`);
  }
}

/**
 * Sanitizes input by removing potentially dangerous characters
 * @param input - Input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/[&]/g, '&amp;') // Escape ampersands
    .trim();
}