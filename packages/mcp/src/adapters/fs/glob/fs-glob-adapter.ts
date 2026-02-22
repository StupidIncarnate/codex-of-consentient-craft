/**
 * PURPOSE: Find files matching glob patterns using the glob npm package
 *
 * USAGE:
 * const files = await fsGlobAdapter({
 *   pattern: GlobPatternStub({ value: '**\/*.ts' }),
 *   cwd: AbsolutePathStub({ value: '/path/to/project' })
 * });
 * // Returns array of FilePath branded strings
 */

import { glob } from 'glob';
import { z } from 'zod';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import type { AbsolutePath } from '../../../contracts/absolute-path/absolute-path-contract';

export const fsGlobAdapter = async ({
  pattern,
  cwd,
}: {
  pattern: GlobPattern;
  cwd?: AbsolutePath;
}): Promise<FilePath[]> => {
  const results = await glob(pattern, {
    ...(cwd ? { cwd } : {}),
    absolute: true,
  });

  return z.array(filePathContract).parse(results);
};
