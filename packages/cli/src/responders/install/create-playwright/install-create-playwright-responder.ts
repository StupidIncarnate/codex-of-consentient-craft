/**
 * PURPOSE: Writes a minimal playwright.config.ts into the target project so `.e2e.ts` tests run, or skips if one exists
 *
 * USAGE:
 * const result = await InstallCreatePlaywrightResponder({ context });
 * // Creates playwright.config.ts or skips if already present
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
  fileContentsContract,
} from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter, fsExistsSyncAdapter } from '@dungeonmaster/shared/adapters';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { playwrightConfigTemplateStatics } from '../../../statics/playwright-config-template/playwright-config-template-statics';

const PACKAGE_NAME = '@dungeonmaster/cli';
const CONFIG_FILENAME = 'playwright.config.ts';

export const InstallCreatePlaywrightResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const configPath = pathJoinAdapter({
    paths: [context.targetProjectRoot, CONFIG_FILENAME],
  });

  if (fsExistsSyncAdapter({ filePath: configPath })) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse('playwright.config.ts already exists'),
    };
  }

  const contents = fileContentsContract.parse(playwrightConfigTemplateStatics.content);

  await fsWriteFileAdapter({ filePath: configPath, contents });

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse('Created playwright.config.ts'),
  };
};
