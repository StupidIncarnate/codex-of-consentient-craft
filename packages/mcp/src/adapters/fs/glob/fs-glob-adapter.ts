/**
 * PURPOSE: Find files matching glob patterns using the glob npm package
 *
 * USAGE:
 * const files = await fsGlobAdapter({
 *   pattern: GlobPatternStub({ value: '**\/*.ts' }),
 *   cwd: AbsolutePathStub({ value: '/path/to/project' })
 * });
 * // Returns array of PathSegment branded strings
 */

import { glob } from 'glob';
import { z } from 'zod';
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { PathSegment, GlobPattern } from '@dungeonmaster/shared/contracts';
import type { AbsolutePath } from '../../../contracts/absolute-path/absolute-path-contract';

export const fsGlobAdapter = async ({
  pattern,
  cwd,
}: {
  pattern: GlobPattern;
  cwd?: AbsolutePath;
}): Promise<PathSegment[]> => {
  const results = await glob(pattern, {
    ...(cwd ? { cwd } : {}),
    absolute: true,
  });

  return z.array(pathSegmentContract).parse(results);
};
