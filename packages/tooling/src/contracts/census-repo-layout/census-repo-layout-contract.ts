/**
 * PURPOSE: What the census learns about a repo before it reads any source: the workspace's own npm
 * scope (null when the root package.json names nothing) and every workspace package with a name.
 * `scope` is the one derived from the root name, never a hard-coded scope.
 *
 * USAGE:
 * censusRepoLayoutContract.parse({ scope: '@acme', packages: [{ name: '@acme/app', dir: 'packages/app' }] });
 * // Returns: CensusRepoLayout
 */
import { z } from '#gateway/npm/zod';
import { censusPackageContract } from '../census-package/census-package-contract';

export const censusRepoLayoutContract = z.object({
  scope: z.string().min(1).brand<'CensusScope'>().nullable(),
  packages: z.array(censusPackageContract),
});

export type CensusRepoLayout = z.infer<typeof censusRepoLayoutContract>;
