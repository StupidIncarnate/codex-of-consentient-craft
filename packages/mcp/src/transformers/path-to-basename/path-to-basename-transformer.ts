/**
 * PURPOSE: Extracts just the filename (basename) from a file path
 *
 * USAGE:
 * const filename = pathToBasenameTransformer({ filepath: PathSegmentStub({ value: '/path/to/file.test.ts' }) });
 * // Returns: 'file.test.ts'
 */
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { FileMetadata } from '../../contracts/file-metadata/file-metadata-contract';

export const pathToBasenameTransformer = ({
  filepath,
}: {
  filepath: FileMetadata['path'];
}): FileMetadata['path'] => {
  const parts = filepath.split('/');
  const basename = parts[parts.length - 1] ?? filepath;

  return pathSegmentContract.parse(basename);
};
