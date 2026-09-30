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

import { dynamicImport } from '#gateway/node/module';
import { installResultContract } from '@dungeonmaster/shared/contracts';
import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';
import { installModuleContract } from '../../../contracts/install-module/install-module-contract';

export const installExecuteBroker = async ({
  packageName,
  installPath,
  context,
  exportName = 'StartInstall',
}: {
  packageName: string;
  installPath: string;
  context: InstallContext;
  exportName?: 'StartInstall' | 'StartInstallFinalize';
}): Promise<InstallResult> => {
  try {
    const parsedModule = installModuleContract.safeParse(
      await dynamicImport({ path: installPath }),
    );

    const installFn = parsedModule.success ? parsedModule.data[exportName] : undefined;

    if (installFn === undefined) {
      return installResultContract.parse({
        packageName,
        success: false,
        action: 'failed',
        error: `No ${exportName} function found in ${installPath}`,
      });
    }

    const result = await installFn({ context });
    return installResultContract.parse(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return installResultContract.parse({
      packageName,
      success: false,
      action: 'failed',
      error: errorMessage,
    });
  }
};
