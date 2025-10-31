import { metadataExtractorTransformer } from './metadata-extractor-transformer';
import { FileContentsStub } from '../../contracts/file-contents/file-contents.stub';

describe('metadataExtractorTransformer', () => {
  it('VALID: {file with PURPOSE, USAGE} => extracts metadata', () => {
    const fileContents = FileContentsStub({
      value: `/**
 * PURPOSE: Fetches user data from the API by user ID
 *
 * USAGE:
 * const user = await userFetchBroker({ userId: UserIdStub('123') });
 * // Returns: User object
 */
export const userFetchBroker = () => {};`,
    });

    const result = metadataExtractorTransformer({ fileContents });

    expect(result).toStrictEqual({
      purpose: 'Fetches user data from the API by user ID',
      usage:
        "const user = await userFetchBroker({ userId: UserIdStub('123') });\n// Returns: User object",
      metadata: {},
    });
  });

  it('VALID: {file with optional WHEN-TO-USE field} => extracts metadata with optional fields', () => {
    const fileContents = FileContentsStub({
      value: `/**
 * PURPOSE: Checks if file is a test file
 *
 * USAGE:
 * if (isTestFileGuard({ filename })) { }
 *
 * WHEN-TO-USE: Need to identify test files by naming convention
 */`,
    });

    const result = metadataExtractorTransformer({ fileContents });

    expect(result?.metadata).toStrictEqual({
      whentouse: 'Need to identify test files by naming convention',
    });
  });

  it('VALID: {file with multiple optional fields} => extracts all optional metadata', () => {
    const fileContents = FileContentsStub({
      value: `/**
 * PURPOSE: Test transformer
 *
 * USAGE:
 * test()
 *
 * WHEN-TO-USE: When testing
 * WHEN-NOT-TO-USE: In production
 * RETURNS: Test result
 */`,
    });

    const result = metadataExtractorTransformer({ fileContents });

    expect(result?.metadata).toStrictEqual({
      whentouse: 'When testing',
      whennottouse: 'In production',
      returns: 'Test result',
    });
  });

  it('EMPTY: {file without metadata comment} => returns null', () => {
    const fileContents = FileContentsStub({
      value: 'export const somethingWithoutMetadata = () => {};',
    });

    const result = metadataExtractorTransformer({ fileContents });

    expect(result).toBeNull();
  });

  describe('spacing variations', () => {
    it('VALID: {no blank lines between sections} => extracts metadata', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Validates permission
 * USAGE: hasPermissionGuard({ user })
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toStrictEqual({
        purpose: 'Validates permission',
        usage: 'hasPermissionGuard({ user })',
        metadata: {},
      });
    });

    it('VALID: {extra blank lines between sections} => extracts metadata', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Test purpose
 *
 *
 * USAGE:
 * test()
 *
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toStrictEqual({
        purpose: 'Test purpose',
        usage: 'test()',
        metadata: {},
      });
    });

    it('VALID: {mixed spacing with tabs} => extracts metadata', () => {
      const fileContents = FileContentsStub({
        value: `/**
 *	PURPOSE: With tabs
 * USAGE:
 *	test()
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toStrictEqual({
        purpose: 'With tabs',
        usage: 'test()',
        metadata: {},
      });
    });
  });

  describe('multi-line values', () => {
    it('VALID: {multi-line USAGE block} => extracts complete usage', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Complex operation
 * USAGE:
 * const result = await complexBroker({
 *   param1: value1,
 *   param2: value2
 * });
 * // Returns: ComplexResult
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result?.usage).toBe(
        `const result = await complexBroker({\nparam1: value1,\nparam2: value2\n});\n// Returns: ComplexResult`,
      );
    });

    it('VALID: {single-line USAGE on same line as header} => extracts usage', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Simple check
 * USAGE: isValid({ value })
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result?.usage).toBe('isValid({ value })');
    });

    it('VALID: {USAGE with code examples and comments} => preserves formatting', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Data transformer
 * USAGE:
 * // Transform user data
 * const dto = transform({ user });
 *
 * // With options
 * const dto = transform({ user, options: { includeEmail: true } });
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result?.usage).toBe(
        `// Transform user data\nconst dto = transform({ user });\n// With options\nconst dto = transform({ user, options: { includeEmail: true } });`,
      );
    });
  });

  describe('PURPOSE field variations', () => {
    it('VALID: {PURPOSE with punctuation} => preserves exact text', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Validates user's permission to edit, update, or delete resources
 * USAGE: check()
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result?.purpose).toBe(
        "Validates user's permission to edit, update, or delete resources",
      );
    });

    it('VALID: {PURPOSE with special characters} => preserves characters', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Formats date/time using ISO-8601 format (YYYY-MM-DD)
 * USAGE: format()
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result?.purpose).toBe('Formats date/time using ISO-8601 format (YYYY-MM-DD)');
    });
  });

  describe('edge cases', () => {
    it('EMPTY: {missing PURPOSE} => returns null', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * USAGE: test()
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toBeNull();
    });

    it('EMPTY: {missing USAGE} => returns null', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Test
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toBeNull();
    });

    it('VALID: {metadata comment not at start of file} => extracts metadata', () => {
      const fileContents = FileContentsStub({
        value: `import { something } from 'somewhere';

/**
 * PURPOSE: Test function
 * USAGE: test()
 */
export const test = () => {};`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result?.purpose).toBe('Test function');
    });
  });

  describe('field ordering', () => {
    it('VALID: {USAGE before PURPOSE} => extracts metadata', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * USAGE: test()
 * PURPOSE: Test with different order
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toStrictEqual({
        purpose: 'Test with different order',
        usage: 'test()',
        metadata: {},
      });
    });
  });

  describe('optional fields placement', () => {
    it('VALID: {optional field between USAGE} => excludes optional field from USAGE', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Test with optional between
 * USAGE: test()
 * RETURNS: Test result
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toStrictEqual({
        purpose: 'Test with optional between',
        usage: 'test()',
        metadata: {
          returns: 'Test result',
        },
      });
    });

    it('VALID: {multiple optional fields between required fields} => extracts all correctly', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Test function
 * WHEN-TO-USE: For testing
 * USAGE: test()
 * WHEN-NOT-TO-USE: In production
 * RETURNS: Test result
 * CONTRACTS: Input: string, Output: boolean
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

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

    it('VALID: {optional field with multi-line USAGE} => preserves USAGE formatting', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Complex operation
 * USAGE:
 * const result = await operation({
 *   param: value
 * });
 * RETURNS: Promise<Result>
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result?.usage).toBe('const result = await operation({\nparam: value\n});');
      expect(result?.metadata).toStrictEqual({
        returns: 'Promise<Result>',
      });
    });
  });
});
