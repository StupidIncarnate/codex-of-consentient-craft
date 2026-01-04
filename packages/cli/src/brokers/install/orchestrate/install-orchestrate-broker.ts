/**
 * PURPOSE: Orchestrates installation of all discovered packages with installers
 *
 * USAGE:
 * const results = await installOrchestrateBroker({
 *   packages: [{packageName: '@dungeonmaster/cli', installPath: '/path/to/start-install.ts'}],
 *   context: {targetProjectRoot: '/project', dungeonmasterRoot: '/dm'}
 * });
 * // Returns array of InstallResult for each package
 */

import { installExecuteBroker } from '../execute/install-execute-broker';
import type {
  InstallContext,
  InstallResult,
  PackageName,
  FilePath,
} from '@dungeonmaster/shared/contracts';

export const installOrchestrateBroker = async ({
  packages,
  context,
}: {
  packages: { packageName: PackageName; installPath: FilePath }[];
  context: InstallContext;
}): Promise<InstallResult[]> => {
  const installPromises = packages.map(async (pkg) =>
    installExecuteBroker({
      packageName: pkg.packageName,
      installPath: pkg.installPath,
      context,
    }),
  );

  const results = await Promise.all(installPromises);
  return results;
};
