/**
 * PURPOSE: Writes a minimal playwright.config.ts into the target project so `.e2e.ts` tests run —
 * skipping when a config already exists, or when the target project is not e2e-eligible
 * (packageType is neither frontend-react nor frontend-ink), since Playwright has nothing to drive
 * against a backend/CLI/library target. Also writes the config's own companion statics file (and
 * its test), the same two files `packageScaffoldFilesTransformer` writes for `create-package` —
 * the scaffolded config imports the companion by relative path for its UNRESOLVABLE_TOKENS list,
 * so a `dungeonmaster init` that wrote only the config would ship a dangling import.
 *
 * USAGE:
 * const result = await InstallCreatePlaywrightResponder({ context });
 * // Creates playwright.config.ts + its companion statics file and test, or skips (already
 * // present, or target isn't e2e-eligible)
 */

import { type InstallContext, type InstallResult, installMessageContract, packageNameContract } from '@dungeonmaster/shared/contracts';
import { architecturePackageE2eEligibleDetectBroker } from '@dungeonmaster/shared/brokers';
import { existsSync } from '#gateway/node/fs';
import { join, dirname } from '#gateway/node/path';
import { ensureDir, writeFile } from '#gateway/node/fs__promises';
import { playwrightConfigTemplateStatics } from '../../../statics/playwright-config-template/playwright-config-template-statics';

const PACKAGE_NAME = '@dungeonmaster/cli';
const CONFIG_FILENAME = 'playwright.config.ts';
const UNRESOLVABLE_TOKEN_STATICS_RELATIVE_PATH =
  'src/statics/e2e-unresolvable-token/e2e-unresolvable-token-statics.ts';
const UNRESOLVABLE_TOKEN_STATICS_TEST_RELATIVE_PATH =
  'src/statics/e2e-unresolvable-token/e2e-unresolvable-token-statics.test.ts';

export const InstallCreatePlaywrightResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const packageRoot = String(context.targetProjectRoot);
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

  const configPath = join(context.targetProjectRoot, CONFIG_FILENAME);

  if (existsSync(configPath)) {
    return {
      packageName: packageNameContract.parse(PACKAGE_NAME),
      success: true,
      action: 'skipped',
      message: installMessageContract.parse('playwright.config.ts already exists'),
    };
  }

  const contents = playwrightConfigTemplateStatics.content;

  await writeFile(configPath, contents);

  const unresolvableTokenStaticsPath = join(context.targetProjectRoot, UNRESOLVABLE_TOKEN_STATICS_RELATIVE_PATH);
  const unresolvableTokenStaticsTestPath = join(context.targetProjectRoot, UNRESOLVABLE_TOKEN_STATICS_TEST_RELATIVE_PATH);

  // Same write shape packageScaffoldWriteBroker uses for any nested scaffold file: ensure the
  // parent directory first, since a fresh target has no src/statics/e2e-unresolvable-token/
  // directory yet.
  await ensureDir(dirname(unresolvableTokenStaticsPath));
  await writeFile(
    unresolvableTokenStaticsPath,
    playwrightConfigTemplateStatics.unresolvableTokenStaticsContent,
  );
  await writeFile(
    unresolvableTokenStaticsTestPath,
    playwrightConfigTemplateStatics.unresolvableTokenStaticsTestContent,
  );

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse('Created playwright.config.ts'),
  };
};
