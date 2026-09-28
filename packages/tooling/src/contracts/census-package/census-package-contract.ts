/**
 * PURPOSE: One workspace package the census found: the name its package.json gives it and where
 * it lives, so a file path can be attributed to the package that owns it.
 *
 * USAGE:
 * censusPackageContract.parse({ name: '@acme/api', dir: 'packages/api' });
 * // Returns: CensusPackage
 */
import { z } from 'zod';
import { censusPathContract } from '../census-path/census-path-contract';

export const censusPackageContract = z.object({
  name: z.string().min(1).brand<'CensusPackageName'>(),
  dir: censusPathContract,
});

export type CensusPackage = z.infer<typeof censusPackageContract>;
