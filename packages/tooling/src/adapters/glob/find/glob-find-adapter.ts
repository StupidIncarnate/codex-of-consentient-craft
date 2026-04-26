/**
 * PURPOSE: Finds files matching a glob pattern, excluding common build/dependency directories.
 *
 * USAGE:
 * const files = await globFindAdapter({ pattern: '**\/*.ts', cwd: '/path/to/dir' });
 * // Returns: readonly AbsoluteFilePath[] (array of absolute file paths)
 */
import { glob } from 'glob';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const globFindAdapter = async ({
  pattern,
  cwd,
}: {
  pattern: GlobPattern;
  cwd?: AbsoluteFilePath;
}): Promise<readonly AbsoluteFilePath[]> => {
  const globOptions = {
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
    ...(cwd ? { cwd: String(cwd) } : {}),
  };
  const files = await glob(pattern, globOptions);

  return files.map((file) => absoluteFilePathContract.parse(file));
};
