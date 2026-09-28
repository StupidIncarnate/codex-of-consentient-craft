/**
 * PURPOSE: Executes a single package's install function by dynamically importing it and calling
 * the named export `exportName` selects — `StartInstall` by default. The CLI orchestration
 * layer's "after all installs" pass (DEF-99) reuses this same broker with
 * `exportName: 'StartInstallFinalize'`, against a package's OPTIONAL `start-install-finalize.js`,
 * rather than duplicating this whole import-call-parse shape for a second export name.
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
  exportName = 'StartInstall',
}: {
  packageName: PackageName;
  installPath: FilePath;
  context: InstallContext;
  exportName?: 'StartInstall' | 'StartInstallFinalize';
}): Promise<InstallResult> => {
  try {
    const module = await runtimeDynamicImportAdapter({ path: installPath });

    if (
      typeof module !== 'object' ||
      module === null ||
      !(exportName in module) ||
      typeof (module as Record<PropertyKey, unknown>)[exportName] !== 'function'
    ) {
      return installResultContract.parse({
        packageName,
        success: false,
        action: 'failed',
        error: errorMessageContract.parse(`No ${exportName} function found in ${installPath}`),
      });
    }

    const startInstallFn = (module as Record<PropertyKey, unknown>)[exportName] as (params: {
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
