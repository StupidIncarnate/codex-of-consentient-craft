/**
 * PURPOSE: Orchestrates discovering packages and running installation, then runs every package's
 * OPTIONAL "after all installs" step (DEF-99) — `installFinalizeOrchestrateBroker` calls
 * `StartInstallFinalize` for whichever discovered packages have a `start-install-finalize.js`, once
 * every package's `StartInstall` above has already finished, so a step like siegelense's
 * `npm install` for a freshly scaffolded `packages/hydration-recipes/` never races another
 * package's own `StartInstall` still writing to `package.json`.
 *
 * USAGE:
 * const results = await installRunBroker({ context });
 * // Discovers packages with installers, runs every StartInstall, then every StartInstallFinalize
 */

import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';

import { packageDiscoverBroker } from '../../package/discover/package-discover-broker';
import { installFinalizeOrchestrateBroker } from '../finalize-orchestrate/install-finalize-orchestrate-broker';
import { installOrchestrateBroker } from '../orchestrate/install-orchestrate-broker';

export const installRunBroker = async ({
  context,
}: {
  context: InstallContext;
}): Promise<InstallResult[]> => {
  const packages = packageDiscoverBroker({
    dungeonmasterRoot: context.dungeonmasterRoot,
  });

  const results = await installOrchestrateBroker({
    packages,
    context,
  });

  const finalizeResults = await installFinalizeOrchestrateBroker({
    packages,
    context,
  });

  return [...results, ...finalizeResults];
};
