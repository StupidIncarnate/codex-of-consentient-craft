/**
 * PURPOSE: One TypeScript file the census read: where it lives in the repo and what it says.
 *
 * USAGE:
 * censusSourceEntryContract.parse({ file: 'packages/a/src/x.ts', text: 'export const x = 1;' });
 * // Returns: CensusSourceEntry
 */
import { z } from '#gateway/npm/zod';

export const censusSourceEntryContract = z.object({
  file: z.string().min(1).brand<'CensusSourceEntryFile'>(),
  text: z.string().brand<'CensusSourceEntryText'>(),
});

export type CensusSourceEntry = z.infer<typeof censusSourceEntryContract>;
