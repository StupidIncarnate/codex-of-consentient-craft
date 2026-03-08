/**
 * PURPOSE: Computes a deterministic design sandbox port from a quest folder name
 *
 * USAGE:
 * const port = questFolderToDesignPortTransformer({ questFolder: '001-add-auth' });
 * // Returns a DesignPort in range 5000-5999
 */

import type { Quest } from '@dungeonmaster/shared/contracts';

type DesignPort = NonNullable<Quest['designPort']>;

const PORT_RANGE_START = 5000;
const PORT_RANGE_SIZE = 1000;
const HASH_MULTIPLIER = 31;

export const questFolderToDesignPortTransformer = ({
  questFolder,
}: {
  questFolder: string;
}): DesignPort => {
  let hash = 0;
  for (const char of questFolder) {
    hash = Math.trunc((hash * HASH_MULTIPLIER + char.charCodeAt(0)) % Number.MAX_SAFE_INTEGER);
  }
  const port = PORT_RANGE_START + (Math.abs(hash) % PORT_RANGE_SIZE);
  return port as unknown as DesignPort;
};
