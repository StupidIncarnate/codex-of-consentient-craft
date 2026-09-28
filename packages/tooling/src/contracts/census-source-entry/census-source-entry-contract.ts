/**
 * PURPOSE: One TypeScript file the census read: where it lives in the repo and what it says.
 *
 * USAGE:
 * censusSourceEntryContract.parse({ file: 'packages/a/src/x.ts', text: 'export const x = 1;' });
 * // Returns: CensusSourceEntry
 */
import { z } from 'zod';
import { censusPathContract } from '../census-path/census-path-contract';
import { sourceCodeContract } from '../source-code/source-code-contract';

export const censusSourceEntryContract = z.object({
  file: censusPathContract,
  text: sourceCodeContract,
});

export type CensusSourceEntry = z.infer<typeof censusSourceEntryContract>;
