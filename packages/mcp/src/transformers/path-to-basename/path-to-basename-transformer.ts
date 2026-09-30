/**
 * PURPOSE: Extracts just the filename (basename) from a file path
 *
 * USAGE:
 * const filename = pathToBasenameTransformer({ filepath: '/path/to/file.test.ts' });
 * // Returns: 'file.test.ts'
 */
import type { FileMetadata } from '../../contracts/file-metadata/file-metadata-contract';
import { fileMetadataContract } from '../../contracts/file-metadata/file-metadata-contract';

export const pathToBasenameTransformer = ({
  filepath,
}: {
  filepath: string;
}): FileMetadata['path'] => {
  const parts = filepath.split('/');
  const basename = parts[parts.length - 1] ?? filepath;

  return fileMetadataContract.shape.path.parse(basename);
};
