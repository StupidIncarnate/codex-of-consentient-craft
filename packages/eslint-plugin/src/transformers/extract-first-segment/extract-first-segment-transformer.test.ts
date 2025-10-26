import { extractFirstSegmentTransformer } from './extract-first-segment-transformer';

describe('extractFirstSegmentTransformer', () => {
  describe('extracting first segment', () => {
    it('VALID: {str: "user-fetch-broker"} => returns "user"', () => {
      const result = extractFirstSegmentTransformer({ str: 'user-fetch-broker' });

      expect(result).toBe('user');
    });

    it('VALID: {str: "http-adapter"} => returns "http"', () => {
      const result = extractFirstSegmentTransformer({ str: 'http-adapter' });

      expect(result).toBe('http');
    });

    it('VALID: {str: "format-date-transformer"} => returns "format"', () => {
      const result = extractFirstSegmentTransformer({ str: 'format-date-transformer' });

      expect(result).toBe('format');
    });
  });

  describe('edge cases', () => {
    it('VALID: {str: "user"} => returns "user"', () => {
      const result = extractFirstSegmentTransformer({ str: 'user' });

      expect(result).toBe('user');
    });

    it('VALID: {str: "a-b-c-d"} => returns "a"', () => {
      const result = extractFirstSegmentTransformer({ str: 'a-b-c-d' });

      expect(result).toBe('a');
    });

    it('VALID: {str: "-test"} => returns ""', () => {
      const result = extractFirstSegmentTransformer({ str: '-test' });

      expect(result).toBe('');
    });
  });
});
