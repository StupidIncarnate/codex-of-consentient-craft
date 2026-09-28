/**
 * PURPOSE: Reports whether the host ESLint config ignores a file, so the pre-edit hook skips paths
 *          that `npm run ward` would never lint (e.g. a consumer's fixture globs in `ignores`)
 *
 * USAGE:
 * const ignored = await eslintIsPathIgnoredBroker({ cwd: '/project', filePath: 'smoke-repo/x.ts' });
 * // Returns true when the resolved config ignores the file; false on any lookup error
 */
import { ESLint } from '#gateway/npm/eslint';
import { resolve } from '#gateway/node/path';
import { cwd } from '#gateway/node/process';

export const eslintIsPathIgnoredBroker = async ({
  cwd: customCwd,
  filePath,
}: {
  cwd?: string;
  filePath: string;
}): Promise<boolean> => {
  try {
    const resolvedWorkingDir = customCwd ?? cwd();
    const eslint = new ESLint({ cwd: resolvedWorkingDir });
    const absolutePath = resolve(resolvedWorkingDir, filePath);
    return await eslint.isPathIgnored(absolutePath);
  } catch {
    // isPathIgnored throws for paths outside cwd; treat as "not ignored" so the hook still lints.
    return false;
  }
};
