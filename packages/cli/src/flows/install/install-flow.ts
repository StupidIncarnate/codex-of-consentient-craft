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
import { InstallCreateTsconfigResponder } from '../../responders/install/create-tsconfig/install-create-tsconfig-responder';
import { InstallCreateJestResponder } from '../../responders/install/create-jest/install-create-jest-responder';

const PACKAGE_NAME = '@dungeonmaster/cli';

export const InstallFlow = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const devDepsResult = await InstallAddDevDepsResponder({ context });
  const playwrightResult = await InstallCreatePlaywrightResponder({ context });
  const tsconfigResult = await InstallCreateTsconfigResponder({ context });
  const jestResult = await InstallCreateJestResponder({ context });

  const success =
    devDepsResult.success &&
    playwrightResult.success &&
    tsconfigResult.success &&
    jestResult.success;
  const created =
    devDepsResult.action === 'created' ||
    playwrightResult.action === 'created' ||
    tsconfigResult.action === 'created' ||
    jestResult.action === 'created';

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success,
    action: created ? 'created' : 'skipped',
    message: installMessageContract.parse(
      `${String(devDepsResult.message)}; ${String(playwrightResult.message)}; ${String(tsconfigResult.message)}; ${String(jestResult.message)}`,
    ),
  };
};
