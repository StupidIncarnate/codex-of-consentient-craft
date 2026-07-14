/**
 * PURPOSE: Adapter for ESLint's isPathIgnored, reporting whether the project config ignores a file
 *
 * USAGE:
 * const ignored = await eslintIsPathIgnoredAdapter({ eslint, filePath: '/path/to/file.ts' });
 * // Returns true when the resolved ESLint config ignores the file (via `ignores` globs)
 */
import type { ESLint } from 'eslint';

export const eslintIsPathIgnoredAdapter = async ({
  eslint,
  filePath,
}: {
  eslint: ESLint;
  filePath: string;
}): Promise<boolean> => eslint.isPathIgnored(filePath);
