/**
 * PURPOSE: Orchestrates the ward package installation — adds .ward/ to .gitignore and the ward npm
 * scripts (ward/lint/typecheck/test) to the target project's package.json
 *
 * USAGE:
 * const result = await InstallFlow({ context });
 * // Adds .ward/ to .gitignore and ward scripts to package.json
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
} from '@dungeonmaster/shared/contracts';
import { InstallWriteGitignoreResponder } from '../../responders/install/write-gitignore/install-write-gitignore-responder';
import { InstallWriteScriptsResponder } from '../../responders/install/write-scripts/install-write-scripts-responder';

const PACKAGE_NAME = '@dungeonmaster/ward';

export const InstallFlow = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const gitignoreResult = await InstallWriteGitignoreResponder({ context });
  const scriptsResult = await InstallWriteScriptsResponder({ context });

  const success = gitignoreResult.success && scriptsResult.success;
  const created =
    gitignoreResult.action === 'created' ||
    gitignoreResult.action === 'merged' ||
    scriptsResult.action === 'created';

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success,
    action: created ? 'created' : 'skipped',
    message: installMessageContract.parse(
      `${String(gitignoreResult.message)}; ${String(scriptsResult.message)}`,
    ),
  };
};
