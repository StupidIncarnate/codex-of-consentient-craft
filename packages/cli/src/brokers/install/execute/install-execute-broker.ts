/**
 * PURPOSE: Executes a single package's install function by dynamically importing it
 *
 * USAGE:
 * const result = await installExecuteBroker({
 *   packageName: '@dungeonmaster/cli' as PackageName,
 *   installPath: '/path/to/start-install.ts' as FilePath,
 *   context: { targetProjectRoot: '/project' as FilePath, dungeonmasterRoot: '/dm' as FilePath }
 * });
 * // Returns InstallResult with success/failure status
 */

import { dynamicImport } from '#gateway/node/module';
import { installResultContract, errorMessageContract } from '@dungeonmaster/shared/contracts';
import type {
  InstallContext,
  InstallResult,
  PackageName,
  FilePath,
} from '@dungeonmaster/shared/contracts';
import { installModuleContract } from '../../../contracts/install-module/install-module-contract';

export const installExecuteBroker = async ({
  packageName,
  installPath,
  context,
}: {
  packageName: PackageName;
  installPath: FilePath;
  context: InstallContext;
}): Promise<InstallResult> => {
  try {
    const parsedModule = installModuleContract.safeParse(
      await dynamicImport({ path: installPath }),
    );

    if (!parsedModule.success) {
      return installResultContract.parse({
        packageName,
        success: false,
        action: 'failed',
        error: errorMessageContract.parse(`No StartInstall function found in ${installPath}`),
      });
    }

    const result = await parsedModule.data.StartInstall({ context });
    return installResultContract.parse(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return installResultContract.parse({
      packageName,
      success: false,
      action: 'failed',
      error: errorMessageContract.parse(errorMessage),
    });
  }
};
