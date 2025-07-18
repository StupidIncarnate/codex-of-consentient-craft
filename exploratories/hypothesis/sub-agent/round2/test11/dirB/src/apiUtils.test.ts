import { 
  createSuccessResponse, 
  createErrorResponse, 
  validateEmail, 
  validateRequired, 
  sanitizeInput,
  ApiResponse 
} from './apiUtils';

describe('APIEndpoint Utility Functions', () => {
  describe('APIEndpoint createSuccessResponse', () => {
    it('should create a success response with data', () => {
      const testData = { id: 1, name: 'Test User' };
      const response = createSuccessResponse(testData);
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(testData);
      expect(response.error).toBeUndefined();
      expect(response.timestamp).toBeDefined();
      expect(new Date(response.timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should create a success response with null data', () => {
      const response = createSuccessResponse(null);
      
      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
      expect(response.error).toBeUndefined();
    });
  });

  describe('APIEndpoint createErrorResponse', () => {
    it('should create an error response with message', () => {
      const errorMessage = 'Something went wrong';
      const response = createErrorResponse(errorMessage);
      
      expect(response.success).toBe(false);
      expect(response.error).toBe(errorMessage);
      expect(response.data).toBeUndefined();
      expect(response.timestamp).toBeDefined();
    });
  });

  describe('APIEndpoint validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test123@test123.org')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('test@domain')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('APIEndpoint validateRequired', () => {
    it('should not throw for valid values', () => {
      expect(() => validateRequired('value', 'field')).not.toThrow();
      expect(() => validateRequired(123, 'number')).not.toThrow();
      expect(() => validateRequired(false, 'boolean')).not.toThrow();
      expect(() => validateRequired([], 'array')).not.toThrow();
    });

    it('should throw for null, undefined, or empty values', () => {
      expect(() => validateRequired(null, 'field')).toThrow('field is required');
      expect(() => validateRequired(undefined, 'field')).toThrow('field is required');
      expect(() => validateRequired('', 'field')).toThrow('field is required');
    });
  });

  describe('APIEndpoint sanitizeInput', () => {
    it('should remove angle brackets', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should escape ampersands', () => {
      expect(sanitizeInput('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
    });

    it('should handle multiple sanitization rules', () => {
      expect(sanitizeInput('  <div>Hello & World</div>  ')).toBe('divHello &amp; World/div');
    });

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });
  });
});