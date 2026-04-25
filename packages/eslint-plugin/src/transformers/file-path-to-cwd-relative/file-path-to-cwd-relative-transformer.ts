/**
 * PURPOSE: Converts an absolute filename to a path relative to a given cwd, returning the original filename when no prefix match exists
 *
 * USAGE:
 * filePathToCwdRelativeTransformer({ filename: '/repo/src/foo.ts', cwd: '/repo' });
 * // Returns 'src/foo.ts' as a branded PathSegment
 *
 * WHEN-TO-USE: When matching ESLint context filenames against cwd-relative glob patterns
 */
import { pathSegmentContract, type PathSegment } from '@dungeonmaster/shared/contracts';

export const filePathToCwdRelativeTransformer = ({
  filename,
  cwd,
}: {
  filename: string;
  cwd: string;
}): PathSegment => {
  if (cwd.length === 0 || !filename.startsWith(cwd)) {
    return pathSegmentContract.parse(filename);
  }
  const sliced = filename.slice(cwd.length);
  return pathSegmentContract.parse(sliced.startsWith('/') ? sliced.slice(1) : sliced);
};
