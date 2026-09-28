/**
 * PURPOSE: Browses a directory by posting an optional path to the API and returning directory entries
 *
 * USAGE:
 * const entries = await directoryBrowseBroker({path: '/home/user'});
 * // Returns DirectoryEntry[]
 */
import { directoryEntryContract } from '@dungeonmaster/shared/contracts';
import type { DirectoryEntry } from '@dungeonmaster/shared/contracts';

import { fetchJson } from '#gateway/browser/fetch';

import { webConfigStatics } from '../../../statics/web-config/web-config-statics';

export const directoryBrowseBroker = async ({
  path,
}: {
  path?: string;
}): Promise<DirectoryEntry[]> => {
  const response = await fetchJson({
    url: webConfigStatics.api.routes.directoriesBrowse,
    method: 'POST',
    body: { path },
  });

  return directoryEntryContract.array().parse(response);
};
