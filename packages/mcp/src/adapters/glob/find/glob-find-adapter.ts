/**
 * PURPOSE: Find files matching glob patterns using the glob npm package
 *
 * USAGE:
 * const files = await globFindAdapter({
 *   pattern: GlobPatternStub({ value: 'star-star-slash-star.ts' })
 * });
 * // Returns: [PathSegment('/path/to/file.ts'), ...]
 */
import { glob } from 'glob';
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { GlobPattern, PathSegment } from '@dungeonmaster/shared/contracts';
import { globIgnoreFilterTransformer } from '../../../transformers/glob-ignore-filter/glob-ignore-filter-transformer';

export const globFindAdapter = async ({
  pattern,
  cwd,
  includeDirectories,
}: {
  pattern: GlobPattern;
  cwd?: PathSegment;
  includeDirectories?: boolean;
}): Promise<readonly PathSegment[]> => {
  const ignore = globIgnoreFilterTransformer({ pattern });

  const files = await glob(pattern, {
    cwd: cwd ? String(cwd) : process.cwd(),
    absolute: true,
    nodir: includeDirectories !== true,
    ignore: [...ignore],
  });

  return files.map((file) => pathSegmentContract.parse(file));
};
