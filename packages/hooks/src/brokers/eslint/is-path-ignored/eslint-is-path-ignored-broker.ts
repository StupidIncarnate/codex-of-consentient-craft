/**
 * PURPOSE: Reports whether the host ESLint config ignores a file, so the pre-edit hook skips paths
 *          that `npm run ward` would never lint (e.g. a consumer's fixture globs in `ignores`)
 *
 * USAGE:
 * const ignored = await eslintIsPathIgnoredBroker({ cwd: '/project', filePath: 'smoke-repo/x.ts' });
 * // Returns true when the resolved config ignores the file; false on any lookup error
 */
import { eslintEslintAdapter } from '../../../adapters/eslint/eslint/eslint-eslint-adapter';
import { eslintIsPathIgnoredAdapter } from '../../../adapters/eslint/is-path-ignored/eslint-is-path-ignored-adapter';
import { pathResolveAdapter } from '../../../adapters/path/resolve/path-resolve-adapter';
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';

export const eslintIsPathIgnoredBroker = async ({
  cwd = processCwdAdapter(),
  filePath,
}: {
  cwd?: string;
  filePath: string;
}): Promise<boolean> => {
  try {
    const eslint = eslintEslintAdapter({ options: { cwd } });
    const absolutePath = pathResolveAdapter({ paths: [cwd, filePath] });
    return await eslintIsPathIgnoredAdapter({ eslint, filePath: absolutePath });
  } catch {
    // isPathIgnored throws for paths outside cwd; treat as "not ignored" so the hook still lints.
    return false;
  }
};
