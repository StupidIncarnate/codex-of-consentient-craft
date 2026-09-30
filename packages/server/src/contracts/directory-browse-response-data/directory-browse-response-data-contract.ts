/**
 * PURPOSE: Defines the `data` DirectoryBrowseResponder returns on success
 *
 * USAGE:
 * const data = directoryBrowseResponseDataContract.parse(value);
 * // Returns validated DirectoryBrowseResponseData
 */

import { z } from '#gateway/npm/zod';
import { directoryEntryContract } from '@dungeonmaster/shared/contracts';

export const directoryBrowseResponseDataContract = z.array(directoryEntryContract);

export type DirectoryBrowseResponseData = z.infer<typeof directoryBrowseResponseDataContract>;
