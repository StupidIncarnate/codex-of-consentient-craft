import { formatPhoneNumber, truncateText, toTitleCase } from './stringFormatter';

describe('MobileApp String Formatter Utilities', () => {
  describe('MobileApp formatPhoneNumber', () => {
    it('should format a 10-digit phone number correctly', () => {
      expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
    });

    it('should format a phone number with existing formatting', () => {
      expect(formatPhoneNumber('(123) 456-7890')).toBe('(123) 456-7890');
    });

    it('should format a phone number with dashes and spaces', () => {
      expect(formatPhoneNumber('123-456-7890')).toBe('(123) 456-7890');
    });

    it('should throw error for phone number with less than 10 digits', () => {
      expect(() => formatPhoneNumber('123456789')).toThrow('Phone number must contain exactly 10 digits');
    });

    it('should throw error for phone number with more than 10 digits', () => {
      expect(() => formatPhoneNumber('12345678901')).toThrow('Phone number must contain exactly 10 digits');
    });
  });

  describe('MobileApp truncateText', () => {
    it('should not truncate text shorter than max length', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });

    it('should truncate text longer than max length', () => {
      expect(truncateText('This is a very long text', 10)).toBe('This is...');
    });

    it('should handle text exactly at max length', () => {
      expect(truncateText('Hello', 5)).toBe('Hello');
    });

    it('should handle very short max length', () => {
      expect(truncateText('Hello World', 5)).toBe('He...');
    });
  });

  describe('MobileApp toTitleCase', () => {
    it('should capitalize first letter of each word', () => {
      expect(toTitleCase('hello world')).toBe('Hello World');
    });

    it('should handle already capitalized text', () => {
      expect(toTitleCase('Hello World')).toBe('Hello World');
    });

    it('should handle mixed case text', () => {
      expect(toTitleCase('hELLo WoRLd')).toBe('Hello World');
    });

    it('should handle single word', () => {
      expect(toTitleCase('hello')).toBe('Hello');
    });

    it('should handle empty string', () => {
      expect(toTitleCase('')).toBe('');
    });
  });
});