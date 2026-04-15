/**
 * PURPOSE: Extracts base path from a file by removing all extensions
 *
 * USAGE:
 * const basePath = fileBasePathTransformer({ filepath: PathSegmentStub({ value: '/test/user-fetch-broker.test.ts' }) });
 * // Returns: '/test/user-fetch-broker'
 */
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { FileMetadata } from '../../contracts/file-metadata/file-metadata-contract';

const EXTENSION_PATTERN = /(\.[a-z]+)*\.(ts|tsx|js|jsx)$/u;

export const fileBasePathTransformer = ({
  filepath,
}: {
  filepath: FileMetadata['path'];
}): FileMetadata['path'] => {
  const basePath = filepath.replace(EXTENSION_PATTERN, '');
  return pathSegmentContract.parse(basePath);
};
