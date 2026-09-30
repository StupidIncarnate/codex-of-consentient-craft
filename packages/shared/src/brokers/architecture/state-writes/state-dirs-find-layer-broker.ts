/**
 * PURPOSE: Lists immediate subdirectory names under a package's src/state/ directory
 *
 * USAGE:
 * const dirs = stateDirsFindLayerBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/orchestrator'),
 * });
 * // Returns ['design-process', 'quest-execution-queue'] as ContentText[]
 *
 * WHEN-TO-USE: State-writes broker discovering in-memory store names from the architecture's
 * state/ folder convention
 */

import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const stateDirsFindLayerBroker = ({
  packageRoot,
}: {
  packageRoot: string;
}): ContentText[] => {
  const stateDirPath = `${String(packageRoot)}/src/state`;
  const entries = safeReaddirLayerBroker({ dirPath: stateDirPath });

  return entries
    .filter((entry) => entry.kind === 'directory')
    .map((entry) => contentTextContract.parse(entry.name));
};
