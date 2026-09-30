/**
 * PURPOSE: One TypeScript file the census read: where it lives in the repo and what it says.
 *
 * USAGE:
 * censusSourceEntryContract.parse({ file: 'packages/a/src/x.ts', text: 'export const x = 1;' });
 * // Returns: CensusSourceEntry
 */
import { z } from '#gateway/npm/zod';
import { censusPathContract } from '../census-path/census-path-contract';

export const censusSourceEntryContract = z.object({
  file: censusPathContract,
  text: z.string().brand<'CensusSourceEntryText'>(),
});

export type CensusSourceEntry = z.infer<typeof censusSourceEntryContract>;
