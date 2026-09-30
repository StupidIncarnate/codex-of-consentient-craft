/**
 * PURPOSE: The adapters one workspace package still holds, in file order. A package with no
 * adapter folder has no entry.
 *
 * USAGE:
 * packageCensusContract.parse({ name: '@acme/api', dir: 'packages/api', adapters: [] });
 * // Returns: PackageCensus
 */
import { z } from '#gateway/npm/zod';
import { censusPackageContract } from '../census-package/census-package-contract';
import { adapterRecordContract } from '../adapter-record/adapter-record-contract';

export const packageCensusContract = censusPackageContract
  .extend({
    adapters: z.array(adapterRecordContract),
  })
  .brand<'PackageCensus'>();

export type PackageCensus = z.infer<typeof packageCensusContract>;
