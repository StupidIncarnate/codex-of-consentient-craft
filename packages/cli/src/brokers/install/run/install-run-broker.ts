/**
 * PURPOSE: Orchestrates discovering packages and running installation
 *
 * USAGE:
 * const results = await installRunBroker({ context });
 * // Discovers packages with installers and runs them all
 */

import type { InstallContext, InstallResult } from '@dungeonmaster/shared/contracts';

import { packageDiscoverBroker } from '../../package/discover/package-discover-broker';
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

  return results;
};
