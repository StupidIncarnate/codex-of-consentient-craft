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
});
