/**
 * PURPOSE: Converts absolute file path to project-relative path by removing CWD
 *
 * USAGE:
 * const relativePath = pathToRelativeTransformer({ filepath: PathSegmentStub({ value: '/home/user/project/src/file.ts' }), cwd: PathSegmentStub({ value: '/home/user/project' }) });
 * // Returns: 'src/file.ts'
 */
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { PathSegment } from '@dungeonmaster/shared/contracts';
import type { FileMetadata } from '../../contracts/file-metadata/file-metadata-contract';

const LEADING_SLASH_PATTERN = /^\//u;

export const pathToRelativeTransformer = ({
  filepath,
  cwd,
}: {
  filepath: FileMetadata['path'];
  cwd: PathSegment;
}): FileMetadata['path'] => {
  // Remove leading cwd and slash
  const relative = filepath.startsWith(cwd)
    ? filepath.slice(cwd.length).replace(LEADING_SLASH_PATTERN, '')
    : filepath;

  return pathSegmentContract.parse(relative);
};
