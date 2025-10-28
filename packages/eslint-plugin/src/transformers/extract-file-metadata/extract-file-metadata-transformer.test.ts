import { extractFileMetadataTransformer } from './extract-file-metadata-transformer';

describe('extractFileMetadataTransformer', () => {
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

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Checks if user has admin permissions',
        usage: `const isAdmin = hasAdminGuard({ user });\n// Returns true if user is admin`,
      });
    });

    it('VALID: {commentText with PURPOSE, USAGE, and RELATED} => returns metadata with related field', () => {
      const commentText = `/**
 * PURPOSE: Transforms user data to DTO format
 *
 * USAGE:
 * const dto = userToDtoTransformer({ user });
 *
 * RELATED: user-contract, user-dto-contract
 */`;

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Transforms user data to DTO format',
        usage: 'const dto = userToDtoTransformer({ user });',
        related: 'user-contract, user-dto-contract',
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
 *
 * RELATED: http-adapter, user-contract
 */`;

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Fetches user data from API',
        usage: `const user = await userFetchBroker({ userId });\nif (user) {\nconsole.log(user.name);\n}\n// Returns User object or throws error`,
        related: 'http-adapter, user-contract',
      });
    });

    it('VALID: {commentText with other optional fields after USAGE} => stops at next field', () => {
      const commentText = `/**
 * PURPOSE: Validates email format
 *
 * USAGE:
 * const isValid = emailGuard({ email: "test@example.com" });
 *
 * WHEN-TO-USE: Use for input validation
 */`;

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Validates email format',
        usage: 'const isValid = emailGuard({ email: "test@example.com" });',
      });
    });
  });

  describe('invalid metadata comments', () => {
    it('INVALID: {commentText missing PURPOSE} => returns null', () => {
      const commentText = `/**
 * USAGE:
 * someFunction();
 */`;

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toBe(null);
    });

    it('INVALID: {commentText missing USAGE} => returns null', () => {
      const commentText = `/**
 * PURPOSE: Does something
 *
 * RELATED: other-function
 */`;

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toBe(null);
    });

    it('INVALID: {commentText with empty PURPOSE} => returns null', () => {
      const commentText = `/**
 * PURPOSE:
 *
 * USAGE:
 * code();
 */`;

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toBe(null);
    });

    it('INVALID: {commentText with empty USAGE} => returns null', () => {
      const commentText = `/**
 * PURPOSE: Does something
 *
 * USAGE:
 *
 */`;

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toBe(null);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {commentText with extra whitespace} => trims correctly', () => {
      const commentText = `/**
 * PURPOSE:    Validates input
 *
 * USAGE:
 *    validate({ input });
 *
 */`;

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Validates input',
        usage: 'validate({ input });',
      });
    });
  });

  describe('spacing variations', () => {
    it('VALID: {no blank lines between sections} => extracts metadata', () => {
      const commentText = `/**
 * PURPOSE: Validates permission
 * USAGE: hasPermissionGuard({ user })
 * RELATED: none
 */`;

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Validates permission',
        usage: 'hasPermissionGuard({ user })',
        related: 'none',
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
 *
 * RELATED: other
 */`;

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Test purpose',
        usage: 'test()',
        related: 'other',
      });
    });
  });

  describe('field ordering', () => {
    it('VALID: {RELATED before USAGE} => extracts metadata correctly', () => {
      const commentText = `/**
 * PURPOSE: Test with different order
 * RELATED: other
 * USAGE: test()
 */`;

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Test with different order',
        usage: 'test()',
        related: 'other',
      });
    });

    it('VALID: {USAGE before PURPOSE} => extracts metadata correctly', () => {
      const commentText = `/**
 * USAGE: test()
 * PURPOSE: Test with different order
 * RELATED: other
 */`;

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Test with different order',
        usage: 'test()',
        related: 'other',
      });
    });

    it('VALID: {all fields in reverse order} => extracts metadata correctly', () => {
      const commentText = `/**
 * RELATED: other
 * USAGE: test()
 * PURPOSE: Test with reverse order
 */`;

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Test with reverse order',
        usage: 'test()',
        related: 'other',
      });
    });
  });

  describe('optional fields between required fields', () => {
    it('VALID: {optional field between USAGE and RELATED} => USAGE stops at optional field', () => {
      const commentText = `/**
 * PURPOSE: Test with optional between
 * USAGE: test()
 * RETURNS: Test result
 * RELATED: other
 */`;

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Test with optional between',
        usage: 'test()',
        related: 'other',
      });
    });

    it('VALID: {multiple optional fields scattered} => all extracted correctly', () => {
      const commentText = `/**
 * PURPOSE: Test function
 * WHEN-TO-USE: For testing
 * USAGE: test()
 * WHEN-NOT-TO-USE: In production
 * RETURNS: Test result
 * RELATED: other
 * CONTRACTS: Input: string, Output: boolean
 */`;

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Test function',
        usage: 'test()',
        related: 'other',
      });
    });

    it('VALID: {optional field before PURPOSE} => PURPOSE extracted correctly', () => {
      const commentText = `/**
 * WHEN-TO-USE: For testing
 * PURPOSE: Test function
 * USAGE: test()
 * RELATED: other
 */`;

      const result = extractFileMetadataTransformer({ commentText });

      expect(result).toStrictEqual({
        purpose: 'Test function',
        usage: 'test()',
        related: 'other',
      });
    });
  });
});
