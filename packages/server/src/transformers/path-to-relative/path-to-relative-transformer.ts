/**
 * PURPOSE: Converts absolute file path to project-relative path by removing CWD
 *
 * USAGE:
 * const relativePath = pathToRelativeTransformer({ filepath: AbsoluteFilePathStub({ value: '/home/user/project/src/file.ts' }) });
 * // Returns: 'src/file.ts' (assuming cwd is /home/user/project)
 */
import { absoluteFilePathContract } from '../../contracts/absolute-file-path/absolute-file-path-contract';
import type { FileMetadata } from '../../contracts/file-metadata/file-metadata-contract';

const LEADING_SLASH_PATTERN = /^\//u;

export const pathToRelativeTransformer = ({
  filepath,
}: {
  filepath: FileMetadata['path'];
}): FileMetadata['path'] => {
  const cwd = process.cwd();

  // Remove leading cwd and slash
  const relative = filepath.startsWith(cwd)
    ? filepath.slice(cwd.length).replace(LEADING_SLASH_PATTERN, '')
    : filepath;

  return absoluteFilePathContract.parse(relative);
};
