/**
 * PURPOSE: Lists immediate subdirectory names under a package's src/state/ directory
 *
 * USAGE:
 * const dirs = stateDirsFindLayerBroker({
 *   packageRoot: '/repo/packages/orchestrator',
 * });
 * // Returns ['design-process', 'quest-execution-queue'] as ContentText[]
 *
 * WHEN-TO-USE: State-writes broker discovering in-memory store names from the architecture's
 * state/ folder convention
 */

import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const stateDirsFindLayerBroker = ({ packageRoot }: { packageRoot: string }): string[] => {
  const stateDirPath = `${packageRoot}/src/state`;
  const entries = safeReaddirLayerBroker({ dirPath: stateDirPath });

  return entries.filter((entry) => entry.kind === 'directory').map((entry) => entry.name);
};
