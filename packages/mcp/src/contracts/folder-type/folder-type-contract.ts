/**
 * PURPOSE: Branded type for folder type identifiers in project architecture
 *
 * USAGE:
 * const folderType = folderTypeContract.parse('brokers');
 * // Returns branded FolderType string
 */

import { z } from '#gateway/npm/zod';

export const folderTypeContract = z.string().brand<'FolderType'>();

export type FolderType = z.infer<typeof folderTypeContract>;
