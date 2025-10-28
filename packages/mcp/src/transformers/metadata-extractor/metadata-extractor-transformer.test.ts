import { metadataExtractorTransformer } from './metadata-extractor-transformer';
import { FileContentsStub } from '../../contracts/file-contents/file-contents.stub';

describe('metadataExtractorTransformer', () => {
  it('VALID: {file with PURPOSE, USAGE, RELATED} => extracts metadata', () => {
    const fileContents = FileContentsStub({
      value: `/**
 * PURPOSE: Fetches user data from the API by user ID
 *
 * USAGE:
 * const user = await userFetchBroker({ userId: UserIdStub('123') });
 * // Returns: User object
 *
 * RELATED: userCreateBroker, userUpdateBroker
 */
export const userFetchBroker = () => {};`,
    });

    const result = metadataExtractorTransformer({ fileContents });

    expect(result).toStrictEqual({
      purpose: 'Fetches user data from the API by user ID',
      usage:
        "const user = await userFetchBroker({ userId: UserIdStub('123') });\n// Returns: User object",
      related: ['userCreateBroker', 'userUpdateBroker'],
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
 *
 * RELATED: hasFileSuffixGuard
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
 *
 * RELATED: otherTest
 */`,
    });

    const result = metadataExtractorTransformer({ fileContents });

    expect(result?.metadata).toStrictEqual({
      whentouse: 'When testing',
      whennottouse: 'In production',
      returns: 'Test result',
    });
  });

  it('VALID: {file with empty RELATED field} => filters out empty items', () => {
    const fileContents = FileContentsStub({
      value: `/**
 * PURPOSE: Standalone utility
 *
 * USAGE:
 * standalone()
 *
 * RELATED: none
 */`,
    });

    const result = metadataExtractorTransformer({ fileContents });

    expect(result?.related).toStrictEqual(['none']);
  });

  it('VALID: {file with single item in RELATED} => returns array with one item', () => {
    const fileContents = FileContentsStub({
      value: `/**
 * PURPOSE: Test
 *
 * USAGE:
 * test()
 *
 * RELATED: singleRelated
 */`,
    });

    const result = metadataExtractorTransformer({ fileContents });

    expect(result?.related).toStrictEqual(['singleRelated']);
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
 * RELATED: none
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toStrictEqual({
        purpose: 'Validates permission',
        usage: 'hasPermissionGuard({ user })',
        related: ['none'],
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
 *
 * RELATED: other
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toStrictEqual({
        purpose: 'Test purpose',
        usage: 'test()',
        related: ['other'],
        metadata: {},
      });
    });

    it('VALID: {mixed spacing with tabs} => extracts metadata', () => {
      const fileContents = FileContentsStub({
        value: `/**
 *	PURPOSE: With tabs
 * USAGE:
 *	test()
 * RELATED: other
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toStrictEqual({
        purpose: 'With tabs',
        usage: 'test()',
        related: ['other'],
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
 * RELATED: simpleBroker
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
 * RELATED: other
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
 * RELATED: validator
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result?.usage).toBe(
        `// Transform user data\nconst dto = transform({ user });\n// With options\nconst dto = transform({ user, options: { includeEmail: true } });`,
      );
    });
  });

  describe('RELATED field variations', () => {
    it('VALID: {RELATED with multiple items and spaces} => parses all items', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Test
 * USAGE: test()
 * RELATED: first,  second , third
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result?.related).toStrictEqual(['first', 'second', 'third']);
    });

    it('VALID: {RELATED with trailing comma} => filters empty items', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Test
 * USAGE: test()
 * RELATED: first, second,
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result?.related).toStrictEqual(['first', 'second']);
    });
  });

  describe('PURPOSE field variations', () => {
    it('VALID: {PURPOSE with punctuation} => preserves exact text', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Validates user's permission to edit, update, or delete resources
 * USAGE: check()
 * RELATED: other
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result?.purpose).toBe("Validates user's permission to edit, update, or delete resources");
    });

    it('VALID: {PURPOSE with special characters} => preserves characters', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Formats date/time using ISO-8601 format (YYYY-MM-DD)
 * USAGE: format()
 * RELATED: parser
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
 * RELATED: other
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toBeNull();
    });

    it('EMPTY: {missing USAGE} => returns null', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Test
 * RELATED: other
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toBeNull();
    });

    it('VALID: {missing RELATED} => returns metadata with empty related array', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Test
 * USAGE: test()
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toStrictEqual({
        purpose: 'Test',
        usage: 'test()',
        related: [],
        metadata: {},
      });
    });

    it('VALID: {metadata comment not at start of file} => extracts metadata', () => {
      const fileContents = FileContentsStub({
        value: `import { something } from 'somewhere';

/**
 * PURPOSE: Test function
 * USAGE: test()
 * RELATED: other
 */
export const test = () => {};`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result?.purpose).toBe('Test function');
    });
  });

  describe('field ordering', () => {
    it('VALID: {fields in different order - RELATED before USAGE} => extracts metadata', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Test with different order
 * RELATED: other
 * USAGE: test()
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toStrictEqual({
        purpose: 'Test with different order',
        usage: 'test()',
        related: ['other'],
        metadata: {},
      });
    });

    it('VALID: {USAGE before PURPOSE} => extracts metadata', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * USAGE: test()
 * PURPOSE: Test with different order
 * RELATED: other
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toStrictEqual({
        purpose: 'Test with different order',
        usage: 'test()',
        related: ['other'],
        metadata: {},
      });
    });
  });

  describe('optional fields placement', () => {
    it('VALID: {optional field between USAGE and RELATED} => excludes optional field from USAGE', () => {
      const fileContents = FileContentsStub({
        value: `/**
 * PURPOSE: Test with optional between
 * USAGE: test()
 * RETURNS: Test result
 * RELATED: other
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toStrictEqual({
        purpose: 'Test with optional between',
        usage: 'test()',
        related: ['other'],
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
 * RELATED: other
 * CONTRACTS: Input: string, Output: boolean
 */`,
      });

      const result = metadataExtractorTransformer({ fileContents });

      expect(result).toStrictEqual({
        purpose: 'Test function',
        usage: 'test()',
        related: ['other'],
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
 * RELATED: helper
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
