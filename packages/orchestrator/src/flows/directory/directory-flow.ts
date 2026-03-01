/**
 * PURPOSE: Orchestrates directory browsing by delegating to the directory-browse responder
 *
 * USAGE:
 * const entries = DirectoryFlow({ path });
 * // Returns DirectoryEntry[] for the given path
 */

import { DirectoryBrowseResponder } from '../../responders/directory/browse/directory-browse-responder';

type BrowseParams = Parameters<typeof DirectoryBrowseResponder>[0];
type BrowseResult = ReturnType<typeof DirectoryBrowseResponder>;

export const DirectoryFlow = ({ path }: BrowseParams): BrowseResult =>
  DirectoryBrowseResponder(path === undefined ? {} : { path });
