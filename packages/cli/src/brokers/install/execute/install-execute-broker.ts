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

import { runtimeDynamicImportAdapter } from '@dungeonmaster/shared/adapters';
import { installResultContract, errorMessageContract } from '@dungeonmaster/shared/contracts';
import type {
  InstallContext,
  InstallResult,
  PackageName,
  FilePath,
} from '@dungeonmaster/shared/contracts';

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
    const module = await runtimeDynamicImportAdapter({ path: installPath });

    if (
      typeof module !== 'object' ||
      module === null ||
      !('StartInstall' in module) ||
      typeof (module as Record<PropertyKey, unknown>).StartInstall !== 'function'
    ) {
      return installResultContract.parse({
        packageName,
        success: false,
        action: 'failed',
        error: errorMessageContract.parse(`No StartInstall function found in ${installPath}`),
      });
    }

    const startInstallFn = (module as Record<PropertyKey, unknown>).StartInstall as (params: {
      context: InstallContext;
    }) => Promise<InstallResult>;

    const result = await startInstallFn({ context });
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
