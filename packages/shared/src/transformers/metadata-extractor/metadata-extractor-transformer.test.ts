import { metadataExtractorTransformer } from './metadata-extractor-transformer';

describe('metadataExtractorTransformer', () => {
  describe('valid metadata comments', () => {
    it('VALID: {commentText with PURPOSE and USAGE} => returns metadata object', () => {
      const commentText = `/**
 * PURPOSE: Checks if user has admin permissions
 *
 * USAGE:
 * const isAdmin = hasAdminGuard({ user });
 * // Returns true if user is admin
 *
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Checks if user has admin permissions',
        usage: `const isAdmin = hasAdminGuard({ user });\n// Returns true if user is admin`,
        metadata: {},
      });
    });

    it('VALID: {commentText with PURPOSE, USAGE} => returns metadata', () => {
      const commentText = `/**
 * PURPOSE: Transforms user data to DTO format
 *
 * USAGE:
 * const dto = userToDtoTransformer({ user });
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Transforms user data to DTO format',
        usage: 'const dto = userToDtoTransformer({ user });',
        metadata: {},
      });
    });

    it('VALID: {commentText with multiline USAGE} => extracts complete usage block', () => {
      const commentText = `/**
 * PURPOSE: Fetches user data from API
 *
 * USAGE:
 * const user = await userFetchBroker({ userId });
 * if (user) {
 *   console.log(user.name);
 * }
 * // Returns User object or throws error
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Fetches user data from API',
        usage: `const user = await userFetchBroker({ userId });\nif (user) {\nconsole.log(user.name);\n}\n// Returns User object or throws error`,
        metadata: {},
      });
    });

    it('VALID: {commentText with optional metadata fields} => extracts optional fields', () => {
      const commentText = `/**
 * PURPOSE: Validates email format
 *
 * USAGE:
 * const isValid = emailGuard({ email: "test@example.com" });
 *
 * WHEN-TO-USE: Use for input validation
 * RETURNS: Boolean indicating validity
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Validates email format',
        usage: 'const isValid = emailGuard({ email: "test@example.com" });',
        metadata: {
          whentouse: 'Use for input validation',
          returns: 'Boolean indicating validity',
        },
      });
    });
  });

  describe('spacing variations', () => {
    it('VALID: {no blank lines between sections} => extracts metadata', () => {
      const commentText = `/**
 * PURPOSE: Validates permission
 * USAGE: hasPermissionGuard({ user })
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Validates permission',
        usage: 'hasPermissionGuard({ user })',
        metadata: {},
      });
    });

    it('VALID: {extra blank lines between sections} => extracts metadata', () => {
      const commentText = `/**
 * PURPOSE: Test purpose
 *
 *
 * USAGE:
 * test()
 *
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Test purpose',
        usage: 'test()',
        metadata: {},
      });
    });

    it('VALID: {mixed spacing with tabs} => extracts metadata', () => {
      const commentText = `/**
 *	PURPOSE: With tabs
 * USAGE:
 *	test()
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'With tabs',
        usage: 'test()',
        metadata: {},
      });
    });
  });

  describe('field ordering', () => {
    it('VALID: {USAGE before PURPOSE} => extracts metadata correctly', () => {
      const commentText = `/**
 * USAGE: test()
 * PURPOSE: Test with different order
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Test with different order',
        usage: 'test()',
        metadata: {},
      });
    });

    it('VALID: {all fields in reverse order} => extracts metadata correctly', () => {
      const commentText = `/**
 * USAGE: test()
 * PURPOSE: Test with reverse order
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Test with reverse order',
        usage: 'test()',
        metadata: {},
      });
    });
  });

  describe('optional fields placement', () => {
    it('VALID: {optional field between USAGE} => USAGE stops at optional field', () => {
      const commentText = `/**
 * PURPOSE: Test with optional between
 * USAGE: test()
 * RETURNS: Test result
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Test with optional between',
        usage: 'test()',
        metadata: {
          returns: 'Test result',
        },
      });
    });

    it('VALID: {multiple optional fields scattered} => all extracted correctly', () => {
      const commentText = `/**
 * PURPOSE: Test function
 * WHEN-TO-USE: For testing
 * USAGE: test()
 * WHEN-NOT-TO-USE: In production
 * RETURNS: Test result
 * CONTRACTS: Input: string, Output: boolean
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Test function',
        usage: 'test()',
        metadata: {
          whentouse: 'For testing',
          whennottouse: 'In production',
          returns: 'Test result',
          contracts: 'Input: string, Output: boolean',
        },
      });
    });

    it('VALID: {optional field before PURPOSE} => PURPOSE extracted correctly', () => {
      const commentText = `/**
 * WHEN-TO-USE: For testing
 * PURPOSE: Test function
 * USAGE: test()
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Test function',
        usage: 'test()',
        metadata: {
          whentouse: 'For testing',
        },
      });
    });
  });

  describe('invalid metadata comments', () => {
    it('EMPTY: {missing PURPOSE} => returns null', () => {
      const commentText = `/**
 * USAGE: test()
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toBeNull();
    });

    it('EMPTY: {missing USAGE} => returns null', () => {
      const commentText = `/**
 * PURPOSE: Test
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toBeNull();
    });

    it('EMPTY: {empty PURPOSE} => returns null', () => {
      const commentText = `/**
 * PURPOSE:
 * USAGE: test()
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toBeNull();
    });

    it('EMPTY: {empty USAGE} => returns null', () => {
      const commentText = `/**
 * PURPOSE: Test
 * USAGE:
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toBeNull();
    });

    it('EMPTY: {comment without metadata fields} => returns null', () => {
      const commentText = `/**
 * Just a regular comment
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('VALID: {PURPOSE with punctuation} => preserves exact text', () => {
      const commentText = `/**
 * PURPOSE: Validates user's permission to edit, update, or delete resources
 * USAGE: check()
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result?.purpose).toBe(
        "Validates user's permission to edit, update, or delete resources",
      );
    });

    it('VALID: {PURPOSE with special characters} => preserves characters', () => {
      const commentText = `/**
 * PURPOSE: Formats date/time using ISO-8601 format (YYYY-MM-DD)
 * USAGE: format()
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result?.purpose).toBe('Formats date/time using ISO-8601 format (YYYY-MM-DD)');
    });

    it('VALID: {extra whitespace} => trims correctly', () => {
      const commentText = `/**
 * PURPOSE:    Validates input
 *
 * USAGE:
 *    validate({ input });
 *
 */`;

      const result = metadataExtractorTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Validates input',
        usage: 'validate({ input });',
        metadata: {},
      });
    });
  });
});
