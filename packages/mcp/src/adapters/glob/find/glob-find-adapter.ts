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

export const globFindAdapter = async ({
  pattern,
  cwd,
}: {
  pattern: GlobPattern;
  cwd?: FilePath;
}): Promise<readonly FilePath[]> => {
  const files = await glob(pattern, {
    cwd: cwd ? String(cwd) : process.cwd(),
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
  });

  return files.map((file) => filePathContract.parse(file));
};
