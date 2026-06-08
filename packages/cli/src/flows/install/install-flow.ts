/**
 * PURPOSE: Orchestrates the CLI package installation by running the add-dev-deps and create-playwright responders
 *
 * USAGE:
 * const result = await InstallFlow({ context });
 * // Adds devDependencies to package.json and writes a playwright.config.ts
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
} from '@dungeonmaster/shared/contracts';
import { InstallAddDevDepsResponder } from '../../responders/install/add-dev-deps/install-add-dev-deps-responder';
import { InstallCreatePlaywrightResponder } from '../../responders/install/create-playwright/install-create-playwright-responder';

const PACKAGE_NAME = '@dungeonmaster/cli';

export const InstallFlow = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const devDepsResult = await InstallAddDevDepsResponder({ context });
  const playwrightResult = await InstallCreatePlaywrightResponder({ context });

  const success = devDepsResult.success && playwrightResult.success;
  const created = devDepsResult.action === 'created' || playwrightResult.action === 'created';

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success,
    action: created ? 'created' : 'skipped',
    message: installMessageContract.parse(
      `${String(devDepsResult.message)}; ${String(playwrightResult.message)}`,
    ),
  };
};
