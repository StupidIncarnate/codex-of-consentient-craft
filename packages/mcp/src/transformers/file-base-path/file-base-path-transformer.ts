/**
 * PURPOSE: Extracts base path from a file by removing all extensions
 *
 * USAGE:
 * const basePath = fileBasePathTransformer({ filepath: '/test/user-fetch-broker.test.ts' });
 * // Returns: '/test/user-fetch-broker'
 */
import type { FileMetadata } from '../../contracts/file-metadata/file-metadata-contract';
import { fileMetadataContract } from '../../contracts/file-metadata/file-metadata-contract';

const EXTENSION_PATTERN = /(\.[a-z]+)*\.(ts|tsx|js|jsx)$/u;

export const fileBasePathTransformer = ({
  filepath,
}: {
  filepath: string;
}): FileMetadata['path'] => {
  const basePath = filepath.replace(EXTENSION_PATTERN, '');
  return fileMetadataContract.shape.path.parse(basePath);
};
