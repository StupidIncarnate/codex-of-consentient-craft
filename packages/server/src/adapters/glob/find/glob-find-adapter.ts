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
  const options = {
    cwd: cwd ? String(cwd) : process.cwd(),
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
  };

  const result = await glob(pattern, options);

  // glob v10 returns string[], glob v7 returns a non-iterable Glob instance.
  // Wrap in callback-based Promise as fallback for v7 compatibility.
  if (Array.isArray(result)) {
    return result.map((file) => filePathContract.parse(file));
  }

  // glob v7 uses callback API: glob(pattern, options, callback)
  const globWithCallback = glob as unknown as (
    p: GlobPattern,
    o: typeof options,
    cb: (error: Error | null, matches: unknown[]) => void,
  ) => void;

  const files: unknown[] = await new Promise((resolve, reject) => {
    globWithCallback(pattern, options, (error, matches) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(matches);
    });
  });

  return files.map((file) => filePathContract.parse(file));
};
