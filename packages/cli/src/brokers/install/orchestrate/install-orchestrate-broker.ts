/**
 * PURPOSE: Orchestrates installation of all discovered packages with installers, one at a time
 *
 * USAGE:
 * const results = await installOrchestrateBroker({
 *   packages: [{packageName: '@dungeonmaster/cli', installPath: '/path/to/start-install.ts'}],
 *   context: {targetProjectRoot: '/project', dungeonmasterRoot: '/dm'}
 * });
 * // Returns array of InstallResult for each package, in discovery order
 *
 * Installs run SEQUENTIALLY, not under Promise.all. Several packages read-modify-write the SAME
 * file — `@dungeonmaster/hooks` writes `.claude/settings.json` hooks while `@dungeonmaster/mcp`
 * writes its `permissions.allow` — so concurrent installs interleave their read and write and the
 * later writer silently drops whatever the other one added. One at a time makes each install see
 * every prior install's output.
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
  const [head, ...rest] = packages;

  if (head === undefined) {
    return [];
  }

  const result = await installExecuteBroker({
    packageName: head.packageName,
    installPath: head.installPath,
    context,
  });

  const remaining = await installOrchestrateBroker({ packages: rest, context });

  return [result, ...remaining];
};
