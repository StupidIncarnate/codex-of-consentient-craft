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

  it('EMPTY: {file without metadata comment} => returns null', () => {
    const fileContents = FileContentsStub({
      value: 'export const somethingWithoutMetadata = () => {};',
    });

    const result = metadataExtractorTransformer({ fileContents });

    expect(result).toBeNull();
  });
});
