/**
 * PURPOSE: Writes a root tsconfig.json extending the published base into the target project, or skips if one exists
 *
 * USAGE:
 * const result = await InstallCreateTsconfigResponder({ context });
 * // Creates tsconfig.json (extends @dungeonmaster/eslint-plugin/tsconfig) or skips if already present
 */

import {
  type InstallContext,
  type InstallResult,
  installMessageContract,
  packageNameContract,
  fileContentsContract,
} from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter, fsExistsSyncAdapter } from '@dungeonmaster/shared/adapters';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { tsconfigTemplateStatics } from '../../../statics/tsconfig-template/tsconfig-template-statics';

const PACKAGE_NAME = '@dungeonmaster/cli';
const CONFIG_FILENAME = locationsStatics.repoRoot.tsconfig;

export const InstallCreateTsconfigResponder = async ({
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
      message: installMessageContract.parse('tsconfig.json already exists'),
    };
  }

  const contents = fileContentsContract.parse(tsconfigTemplateStatics.content);

  await fsWriteFileAdapter({ filePath: configPath, contents });

  return {
    packageName: packageNameContract.parse(PACKAGE_NAME),
    success: true,
    action: 'created',
    message: installMessageContract.parse('Created tsconfig.json'),
  };
};
