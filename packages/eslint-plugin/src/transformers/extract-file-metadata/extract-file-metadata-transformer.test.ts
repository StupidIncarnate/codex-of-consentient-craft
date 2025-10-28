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
});
