/**
 * PURPOSE: Find files matching glob patterns using the glob npm package
 *
 * USAGE:
 * const files = await globFindAdapter({
 *   pattern: GlobPatternStub({ value: 'star-star-slash-star.ts' })
 * });
 * // Returns: [FilePath('/path/to/file.ts'), ...]
 */
import { glob } from 'glob';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { globIgnoreFilterTransformer } from '../../../transformers/glob-ignore-filter/glob-ignore-filter-transformer';

export const globFindAdapter = async ({
  pattern,
  cwd,
  includeDirectories,
}: {
  pattern: GlobPattern;
  cwd?: FilePath;
  includeDirectories?: boolean;
}): Promise<readonly FilePath[]> => {
  const ignore = globIgnoreFilterTransformer({ pattern });

  const files = await glob(pattern, {
    cwd: cwd ? String(cwd) : process.cwd(),
    absolute: true,
    nodir: includeDirectories !== true,
    ignore: [...ignore],
  });

  return files.map((file) => filePathContract.parse(file));
};
