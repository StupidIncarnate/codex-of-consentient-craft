/**
 * PURPOSE: Checks if a filesystem path is usable, answering false for every failure of the probe.
 * A guild path that is missing and one that is present but cannot be probed both mean "not usable",
 * and one such path must not fail the listing of every other guild — which is why this swallows the
 * rejection, where `pathExists` alone rejects on EACCES.
 *
 * USAGE:
 * await pathIsAccessibleBroker({path: GuildPathStub({value: '/home/user/project'})});
 * // Returns true if the path exists, false otherwise (never throws)
 */

import type { GuildPath } from '@dungeonmaster/shared/contracts';
import { pathExists } from '#gateway/node/fs__promises';

export const pathIsAccessibleBroker = async ({ path }: { path?: GuildPath }): Promise<boolean> => {
  if (!path) {
    return false;
  }

  try {
    return await pathExists(path);
  } catch {
    return false;
  }
};
