/**
 * PURPOSE: Looks for `node_modules/.bin/<binName>` in `dir`, then in each ancestor, stopping after
 * the workspace root (or the filesystem root when no ancestor declares workspaces). The bare name
 * is the answer when nothing is found, which leaves the resolution to `PATH`.
 *
 * USAGE:
 * binWalkUpLayerBroker({ binName: 'jest', dir: '/repo/packages/ward' });
 * // Returns BinCommand('/repo/node_modules/.bin/jest') when only the root has it
 */

import { existsSync } from '#gateway/node/fs';
import { dirname, join } from '#gateway/node/path';

import { binWorkspaceRootLayerBroker } from './bin-workspace-root-layer-broker';

export const binWalkUpLayerBroker = ({
  binName,
  dir,
}: {
  binName: string;
  dir: string;
}): string => {
  const candidate = join(dir, 'node_modules', '.bin', binName);
  if (existsSync(candidate)) {
    return candidate;
  }

  if (binWorkspaceRootLayerBroker({ dir })) {
    return binName;
  }

  const parent = dirname(dir);
  if (parent === dir) {
    return binName;
  }

  return binWalkUpLayerBroker({ binName, dir: parent });
};
