/**
 * PURPOSE: Adds up a census so an operator can see its size and diff it between runs. A proxy that
 * composes several callers, or stages several catch-alls, is counted once, because each proxy is one
 * file to edit however many adapters reach it.
 *
 * USAGE:
 * adapterCensusTotalsTransformer({ packages });
 * // Returns { adapters, passThrough, logic, productionCallers, composingProxies, catchAllProxies }
 */
import { censusCountContract } from '../../contracts/census-count/census-count-contract';
import type { AdapterCensus } from '../../contracts/adapter-census/adapter-census-contract';
import type { PackageCensus } from '../../contracts/package-census/package-census-contract';

export const adapterCensusTotalsTransformer = ({
  packages,
}: {
  packages: readonly PackageCensus[];
}): AdapterCensus['totals'] => {
  const adapters = packages.flatMap((pkg) => pkg.adapters);
  const callers = adapters.flatMap((adapter) => adapter.productionCallers);

  return {
    adapters: censusCountContract.parse(adapters.length),
    passThrough: censusCountContract.parse(
      adapters.filter((adapter) => adapter.shape === 'pass-through').length,
    ),
    logic: censusCountContract.parse(
      adapters.filter((adapter) => adapter.shape === 'logic').length,
    ),
    productionCallers: censusCountContract.parse(callers.length),
    composingProxies: censusCountContract.parse(
      new Set(callers.flatMap((caller) => caller.composedBy)).size,
    ),
    catchAllProxies: censusCountContract.parse(
      new Set(callers.flatMap((caller) => caller.catchAll.map((proxy) => proxy.file))).size,
    ),
  };
};
