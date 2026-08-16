/**
 * PURPOSE: Find files matching glob patterns using the glob npm package
 *
 * The ignore list is a required argument rather than something resolved here: what a scan skips is
 * a decision built from the repo's .gitignore and the caller's own glob, and a default here would
 * let a call site quietly scan a different tree than every other one.
 *
 * USAGE:
 * const files = await globFindAdapter({
 *   pattern: GlobPatternStub({ value: 'star-star-slash-star.ts' }),
 *   cwd: PathSegmentStub({ value: '/home/user/project' }),
 *   ignore: [GlobPatternStub({ value: 'star-star-slash-node_modules-slash-star-star' })],
 * });
 * // Returns: [PathSegment('/path/to/file.ts'), ...]
 */
import { glob } from 'glob';
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { GlobPattern, PathSegment } from '@dungeonmaster/shared/contracts';

export const globFindAdapter = async ({
  pattern,
  cwd,
  includeDirectories,
  ignore,
}: {
  pattern: GlobPattern;
  cwd: PathSegment;
  includeDirectories?: boolean;
  ignore: readonly GlobPattern[];
}): Promise<readonly PathSegment[]> => {
  const files = await glob(pattern, {
    cwd: String(cwd),
    absolute: true,
    nodir: includeDirectories !== true,
    ignore: [...ignore],
  });

  return files.map((file) => pathSegmentContract.parse(file));
};
