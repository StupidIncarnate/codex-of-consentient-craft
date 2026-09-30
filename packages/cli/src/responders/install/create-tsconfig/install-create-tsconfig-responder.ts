/**
 * PURPOSE: Writes a root tsconfig.json extending the published base into the target project, or skips if one exists
 *
 * USAGE:
 * const result = await InstallCreateTsconfigResponder({ context });
 * // Creates tsconfig.json (extends @dungeonmaster/eslint-plugin/tsconfig) or skips if already present
 */

import { type InstallContext, type InstallResult, installResultContract } from '@dungeonmaster/shared/contracts';
import { existsSync } from '#gateway/node/fs';
import { writeFile } from '#gateway/node/fs__promises';
import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { tsconfigTemplateStatics } from '../../../statics/tsconfig-template/tsconfig-template-statics';

const PACKAGE_NAME = '@dungeonmaster/cli';
const CONFIG_FILENAME = locationsStatics.repoRoot.tsconfig;

export const InstallCreateTsconfigResponder = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult> => {
  const configPath = join(context.targetProjectRoot, CONFIG_FILENAME);

  if (existsSync(configPath)) {
    return installResultContract.parse({
      packageName: PACKAGE_NAME,
      success: true,
      action: 'skipped',
      message: 'tsconfig.json already exists',
    });
  }

  const contents = tsconfigTemplateStatics.content;

  await writeFile(configPath, contents);

  return installResultContract.parse({
    packageName: PACKAGE_NAME,
    success: true,
    action: 'created',
    message: 'Created tsconfig.json',
  });
};
