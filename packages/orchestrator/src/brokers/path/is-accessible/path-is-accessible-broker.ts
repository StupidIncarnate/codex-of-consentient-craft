/**
 * PURPOSE: Answers whether a guild's registered path is a readable directory, which is what a
 * guild list item's `valid` flag reports. A path that is not absolute is reported not accessible
 * rather than thrown on: the flag exists so ONE bad config entry is shown as invalid, and a throw
 * here fails the whole guild list — every page, and the execution queue, with it.
 *
 * USAGE:
 * await pathIsAccessibleBroker({path: GuildPathStub({value: '/home/user/project'})});
 * // Returns true if the path exists, false otherwise (never throws)
 */

import { pathExists } from '#gateway/node/fs__promises';

import { isAbsolutePathGuard } from '../../../guards/is-absolute-path/is-absolute-path-guard';

export const pathIsAccessibleBroker = async ({ path }: { path?: string }): Promise<boolean> => {
  if (!path) {
    return false;
  }

  if (!isAbsolutePathGuard({ path })) {
    return false;
  }

  // `pathExists` rejects on EACCES; one unprobeable guild path must not fail the whole listing.
  try {
    return await pathExists(path);
  } catch {
    return false;
  }
};
