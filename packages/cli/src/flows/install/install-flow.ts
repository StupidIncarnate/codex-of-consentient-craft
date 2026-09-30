/**
 * PURPOSE: Orchestrates the CLI package installation by running the add-dev-deps and create-playwright responders
 *
 * USAGE:
 * const result = await InstallFlow({ context });
 * // Adds devDependencies to package.json and writes a playwright.config.ts
 */

import { type InstallContext, type InstallResult, installResultContract } from '@dungeonmaster/shared/contracts';
import { InstallAddDevDepsResponder } from '../../responders/install/add-dev-deps/install-add-dev-deps-responder';
import { InstallCreatePlaywrightResponder } from '../../responders/install/create-playwright/install-create-playwright-responder';
import { InstallCreateTsconfigResponder } from '../../responders/install/create-tsconfig/install-create-tsconfig-responder';
import { InstallCreateJestResponder } from '../../responders/install/create-jest/install-create-jest-responder';
import { InstallSetupGatewayResponder } from '../../responders/install/setup-gateway/install-setup-gateway-responder';

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
  // Runs LAST — it depends on tsconfig.json already existing, which InstallCreateTsconfigResponder
  // guarantees for a target with none, and merges into whatever InstallAddDevDepsResponder already
  // wrote rather than racing it.
  const gatewayResult = await InstallSetupGatewayResponder({ context });

  const success =
    devDepsResult.success &&
    playwrightResult.success &&
    tsconfigResult.success &&
    jestResult.success &&
    gatewayResult.success;
  const created =
    devDepsResult.action === 'created' ||
    playwrightResult.action === 'created' ||
    tsconfigResult.action === 'created' ||
    jestResult.action === 'created' ||
    gatewayResult.action === 'created';

  return installResultContract.parse({
    packageName: PACKAGE_NAME,
    success,
    action: created ? 'created' : 'skipped',
    message: `${String(devDepsResult.message)}; ${String(playwrightResult.message)}; ${String(tsconfigResult.message)}; ${String(jestResult.message)}; ${String(gatewayResult.message)}`,
  });
};
