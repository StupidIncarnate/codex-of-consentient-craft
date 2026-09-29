/**
 * PURPOSE: Answers whether a guild's registered path is a readable directory, which is what a
 * guild list item's `valid` flag reports. A path that is not absolute is reported not accessible
 * rather than thrown on: the flag exists so ONE bad config entry is shown as invalid, and a throw
 * here fails the whole guild list — every page, and the execution queue, with it.
 *
 * USAGE:
 * await pathIsAccessibleBroker({path: GuildPathStub({value: '/home/user/project'})});
 * // Returns true if accessible, false otherwise (never throws)
 */

import { absoluteFilePathContract, filePathContract } from '@dungeonmaster/shared/contracts';
import type { GuildPath } from '@dungeonmaster/shared/contracts';

import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';

export const pathIsAccessibleBroker = async ({ path }: { path?: GuildPath }): Promise<boolean> => {
  if (!path) {
    return false;
  }

  if (!absoluteFilePathContract.safeParse(path).success) {
    return false;
  }

  return fsIsAccessibleAdapter({ filePath: filePathContract.parse(path) });
};
