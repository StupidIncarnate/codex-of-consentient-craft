/**
 * PURPOSE: Collects every proxy that composes a proxy, directly or through other proxies. A test
 * that stages through the outermost one still reaches this proxy's mocks, so a migration of the
 * adapter under it has to consider all of them. The graph may hold cycles; each proxy is listed
 * once, and never the starting proxy itself.
 *
 * USAGE:
 * proxyComposersCollectTransformer({ proxyFile, composersByProxy });
 * // Returns the sorted CensusPath list of every proxy that imports it, transitively
 */
import type { CensusPath } from '../../contracts/census-path/census-path-contract';

export const proxyComposersCollectTransformer = ({
  proxyFile,
  composersByProxy,
}: {
  proxyFile: CensusPath;
  composersByProxy: ReadonlyMap<CensusPath, readonly CensusPath[]>;
}): CensusPath[] => {
  const seen = new Set<CensusPath>();
  const pending = [...(composersByProxy.get(proxyFile) ?? [])];

  while (pending.length > 0) {
    const next = pending.pop();
    if (next === undefined || next === proxyFile || seen.has(next)) {
      continue;
    }
    seen.add(next);
    pending.push(...(composersByProxy.get(next) ?? []));
  }

  return [...seen].sort();
};
