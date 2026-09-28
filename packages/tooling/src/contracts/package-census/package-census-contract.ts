/**
 * PURPOSE: The adapters one workspace package still holds, in file order. A package with no
 * adapter folder has no entry.
 *
 * USAGE:
 * packageCensusContract.parse({ name: '@acme/api', dir: 'packages/api', adapters: [] });
 * // Returns: PackageCensus
 */
import { z } from 'zod';
import { censusPackageContract } from '../census-package/census-package-contract';
import { adapterRecordContract } from '../adapter-record/adapter-record-contract';

export const packageCensusContract = censusPackageContract.extend({
  adapters: z.array(adapterRecordContract),
});

export type PackageCensus = z.infer<typeof packageCensusContract>;
