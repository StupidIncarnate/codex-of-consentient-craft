/**
 * PURPOSE: Checks if a filesystem path is readable by attempting fs.access
 *
 * USAGE:
 * await pathIsAccessibleBroker({path: GuildPathStub({value: '/home/user/project'})});
 * // Returns true if accessible, false otherwise (never throws)
 */

import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { GuildPath } from '@dungeonmaster/shared/contracts';

import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';

export const pathIsAccessibleBroker = async ({ path }: { path?: GuildPath }): Promise<boolean> => {
  if (!path) {
    return false;
  }

  const filePath = filePathContract.parse(path);
  return fsIsAccessibleAdapter({ filePath });
};
