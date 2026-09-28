/**
 * PURPOSE: Runs every discovered package's OPTIONAL `start-install-finalize.js`, one at a time,
 * after `installOrchestrateBroker`'s main pass has already finished every package's `StartInstall`
 * (DEF-99) — this is the "after all installs" step itself. A package with no
 * `finalizeInstallPath` (packageDiscoverBroker found no sibling file) is skipped without an import
 * attempt. Sequential for the same reason `installOrchestrateBroker` is: a finalize step may run
 * `npm install` at the repo root, and two of those racing would step on each other exactly like two
 * `StartInstall`s racing `.claude/settings.json`.
 *
 * USAGE:
 * const results = await installFinalizeOrchestrateBroker({
 *   packages: [{
 *     packageName: '@dungeonmaster/siegelense',
 *     installPath: '/path/to/start-install.ts',
 *     finalizeInstallPath: '/path/to/start-install-finalize.ts',
 *   }],
 *   context: {targetProjectRoot: '/project', dungeonmasterRoot: '/dm'}
 * });
 * // Returns InstallResult for every package that HAD a finalizeInstallPath, in discovery order
 */

import { installExecuteBroker } from '../execute/install-execute-broker';
import type {
  InstallContext,
  InstallResult,
  PackageName,
  FilePath,
} from '@dungeonmaster/shared/contracts';

export const installFinalizeOrchestrateBroker = async ({
  packages,
  context,
}: {
  packages: {
    packageName: PackageName;
    installPath: FilePath;
    finalizeInstallPath: FilePath | null;
  }[];
  context: InstallContext;
}): Promise<InstallResult[]> => {
  const [head, ...rest] = packages;

  if (head === undefined) {
    return [];
  }

  if (head.finalizeInstallPath === null) {
    return installFinalizeOrchestrateBroker({ packages: rest, context });
  }

  const result = await installExecuteBroker({
    packageName: head.packageName,
    installPath: head.finalizeInstallPath,
    context,
    exportName: 'StartInstallFinalize',
  });

  const remaining = await installFinalizeOrchestrateBroker({ packages: rest, context });

  return [result, ...remaining];
};
