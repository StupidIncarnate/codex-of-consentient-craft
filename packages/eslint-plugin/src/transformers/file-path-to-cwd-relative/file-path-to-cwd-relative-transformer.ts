/**
 * PURPOSE: Converts an absolute filename to a path relative to a given cwd, returning the original filename when no prefix match exists
 *
 * USAGE:
 * filePathToCwdRelativeTransformer({ filename: '/repo/src/foo.ts', cwd: '/repo' });
 * // Returns 'src/foo.ts' as a branded PathSegment
 *
 * WHEN-TO-USE: When matching ESLint context filenames against cwd-relative glob patterns
 */

export const filePathToCwdRelativeTransformer = ({
  filename,
  cwd,
}: {
  filename: string;
  cwd: string;
}): string => {
  if (cwd.length === 0 || !filename.startsWith(cwd)) {
    return filename;
  }
  const sliced = filename.slice(cwd.length);
  return (sliced.startsWith('/') ? sliced.slice(1) : sliced);
};
