/**
 * PURPOSE: Writes a minimal playwright.config.ts into the target project so `.e2e.ts` tests run —
 * skipping when a config already exists, or when the target project is not e2e-eligible
 * (packageType is neither frontend-react nor frontend-ink), since Playwright has nothing to drive
 * against a backend/CLI/library target.
 *
 * USAGE:
 * const result = await InstallCreatePlaywrightResponder({ context });
 * // Creates playwright.config.ts, or skips (already present, or target isn't e2e-eligible)
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
  fileContentsContract,
  absoluteFilePathContract,
} from '@dungeonmaster/shared/contracts';
import { architecturePackageE2eEligibleDetectBroker } from '@dungeonmaster/shared/brokers';
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
  const packageRoot = absoluteFilePathContract.parse(String(context.targetProjectRoot));
  const e2eEligible = await architecturePackageE2eEligibleDetectBroker({ packageRoot });

  if (!e2eEligible) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse(
        'target project is not e2e-eligible (packageType is not frontend-react or frontend-ink)',
      ),
    };
  }

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
