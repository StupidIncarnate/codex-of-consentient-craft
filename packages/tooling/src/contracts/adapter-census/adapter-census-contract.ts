/**
 * PURPOSE: The whole result of one census run, the document an operator diffs between runs. `scope`
 * is the workspace's own npm scope, read from the root package.json name, and is null when the
 * root names nothing.
 *
 * USAGE:
 * adapterCensusContract.parse({ scope: '@acme', packages: [], totals: { adapters: 0, passThrough: 0, logic: 0, productionCallers: 0, composingProxies: 0, catchAllProxies: 0 } });
 * // Returns: AdapterCensus
 */
import { z } from '#gateway/npm/zod';
import { packageCensusContract } from '../package-census/package-census-contract';
import { censusCountContract } from '../census-count/census-count-contract';

export const adapterCensusContract = z.object({
  scope: z.string().min(1).brand<'CensusScope'>().nullable(),
  packages: z.array(packageCensusContract),
  totals: z.object({
    adapters: censusCountContract,
    passThrough: censusCountContract,
    logic: censusCountContract,
    productionCallers: censusCountContract,
    composingProxies: censusCountContract,
    catchAllProxies: censusCountContract,
  }),
});

export type AdapterCensus = z.infer<typeof adapterCensusContract>;
