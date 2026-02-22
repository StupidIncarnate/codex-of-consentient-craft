/**
 * PURPOSE: Extracts just the filename (basename) from a file path
 *
 * USAGE:
 * const filename = pathToBasenameTransformer({ filepath: AbsoluteFilePathStub({ value: '/path/to/file.test.ts' }) });
 * // Returns: 'file.test.ts'
 */
import { absoluteFilePathContract } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import type { FileMetadata } from '../../contracts/file-metadata/file-metadata-contract';

export const pathToBasenameTransformer = ({
  filepath,
}: {
  filepath: FileMetadata['path'];
}): FileMetadata['path'] => {
  const parts = filepath.split('/');
  const basename = parts[parts.length - 1] ?? filepath;

  return absoluteFilePathContract.parse(basename);
};
