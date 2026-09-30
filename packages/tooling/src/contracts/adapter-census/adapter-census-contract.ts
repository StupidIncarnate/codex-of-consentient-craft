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

export const adapterCensusContract = z.object({
  scope: z.string().min(1).brand<'CensusScope'>().nullable(),
  packages: z.array(packageCensusContract),
  totals: z.object({
    adapters: z.number().int().min(0).brand<'AdapterCensusTotalsAdapters'>(),
    passThrough: z.number().int().min(0).brand<'AdapterCensusTotalsPassThrough'>(),
    logic: z.number().int().min(0).brand<'AdapterCensusTotalsLogic'>(),
    productionCallers: z.number().int().min(0).brand<'AdapterCensusTotalsProductionCallers'>(),
    composingProxies: z.number().int().min(0).brand<'AdapterCensusTotalsComposingProxies'>(),
    catchAllProxies: z.number().int().min(0).brand<'AdapterCensusTotalsCatchAllProxies'>(),
  }),
});

export type AdapterCensus = z.infer<typeof adapterCensusContract>;
