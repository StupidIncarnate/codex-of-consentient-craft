/**
 * PURPOSE: Delegates directory browsing to the directory-browse broker
 *
 * USAGE:
 * const entries = DirectoryBrowseResponder({ path });
 * // Returns DirectoryEntry[] for the given path
 */

import type { DirectoryEntry, GuildPath } from '@dungeonmaster/shared/contracts';

import { directoryBrowseBroker } from '../../../brokers/directory/browse/directory-browse-broker';

export const DirectoryBrowseResponder = ({ path }: { path?: GuildPath }): DirectoryEntry[] =>
  directoryBrowseBroker(path === undefined ? {} : { path });
