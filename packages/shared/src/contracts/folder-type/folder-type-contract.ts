/**
 * PURPOSE: Validates folder type enum values dynamically extracted from folder configuration statics
 *
 * USAGE:
 * const folderType = folderTypeContract.parse('brokers');
 * // Returns branded FolderType (e.g., 'brokers', 'adapters', 'contracts', 'guards')
 */
import { z } from 'zod';
import { folderConfigStatics } from '@dungeonmaster/shared/statics';

const allFolderTypes = Object.keys(folderConfigStatics);

// Ensure array is non-empty for z.enum()
if (allFolderTypes.length === 0) {
  throw new Error('folderConfigStatics must have at least one folder type');
}

// TypeScript can't infer that first is defined after length check, so we verify it
const [firstType, ...restTypes] = allFolderTypes;

if (firstType === undefined) {
  throw new Error('Unexpected: first folder type is undefined despite length check');
}

export const folderTypeContract = z.enum([firstType, ...restTypes]).brand<'FolderType'>();

export type FolderType = z.infer<typeof folderTypeContract>;
