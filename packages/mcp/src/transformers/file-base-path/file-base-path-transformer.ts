/**
 * PURPOSE: Extracts base path from a file by removing all extensions
 *
 * USAGE:
 * const basePath = fileBasePathTransformer({ filepath: FilePathStub({ value: '/test/user-fetch-broker.test.ts' }) });
 * // Returns: '/test/user-fetch-broker'
 */
import { absoluteFilePathContract } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import type { FileMetadata } from '../../contracts/file-metadata/file-metadata-contract';

const EXTENSION_PATTERN = /(\.[a-z]+)*\.(ts|tsx|js|jsx)$/u;

export const fileBasePathTransformer = ({
  filepath,
}: {
  filepath: FileMetadata['path'];
}): FileMetadata['path'] => {
  const basePath = filepath.replace(EXTENSION_PATTERN, '');
  return absoluteFilePathContract.parse(basePath);
};
