/**
 * PURPOSE: Answers "who imports this?" for every adapter and every proxy, by resolving each
 * import to the file that defines the name (through package-root barrels and `export *` chains),
 * never by matching file names. A plain text scan of the file stem merges same-named adapters
 * across packages; resolution does not. Barrels are not importers, they only forward.
 *
 * USAGE:
 * adapterCensusBuildImportersLayerBroker({ sources, factsByFile, kindByFile, knownFiles, layout, adapterFiles });
 * // Returns a map from an adapter or proxy file to the sorted files that import it
 */
import { barrelOriginsIndexTransformer } from '../../../transformers/barrel-origins-index/barrel-origins-index-transformer';
import { importTargetResolveTransformer } from '../../../transformers/import-target-resolve/import-target-resolve-transformer';
import type { CensusFileKind } from '../../../contracts/census-file-kind/census-file-kind-contract';
import type { CensusPath } from '../../../contracts/census-path/census-path-contract';
import type { CensusRepoLayout } from '../../../contracts/census-repo-layout/census-repo-layout-contract';
import type { CensusSourceEntry } from '../../../contracts/census-source-entry/census-source-entry-contract';
import type { ExportName } from '../../../contracts/export-name/export-name-contract';
import type { SourceFacts } from '../../../contracts/source-facts/source-facts-contract';

export const adapterCensusBuildImportersLayerBroker = ({
  sources,
  factsByFile,
  kindByFile,
  knownFiles,
  layout,
  adapterFiles,
}: {
  sources: readonly CensusSourceEntry[];
  factsByFile: ReadonlyMap<CensusPath, SourceFacts>;
  kindByFile: ReadonlyMap<CensusPath, CensusFileKind>;
  knownFiles: ReadonlySet<CensusPath>;
  layout: CensusRepoLayout;
  adapterFiles: ReadonlySet<CensusPath>;
}): ReadonlyMap<CensusPath, readonly CensusPath[]> => {
  const barrelIndexes = new Map<CensusPath, ReadonlyMap<ExportName, CensusPath>>();
  for (const { file } of sources) {
    if (kindByFile.get(file) === 'barrel' && (factsByFile.get(file)?.reExports.length ?? 0) > 0) {
      barrelIndexes.set(
        file,
        barrelOriginsIndexTransformer({ file, factsByFile, knownFiles, packages: layout.packages }),
      );
    }
  }

  const importers = new Map<CensusPath, Set<CensusPath>>();
  for (const { file } of sources) {
    const kind = kindByFile.get(file);
    if (kind === 'barrel' || kind === undefined) {
      continue;
    }
    for (const ref of factsByFile.get(file)?.imports ?? []) {
      const target = importTargetResolveTransformer({
        fromFile: file,
        specifier: ref.specifier,
        knownFiles,
        packages: layout.packages,
      });
      if (target === null) {
        continue;
      }
      const index = barrelIndexes.get(target);
      const origins =
        index === undefined || ref.names.length === 0
          ? [target]
          : ref.names.map((name) => index.get(name) ?? target);

      for (const origin of origins) {
        if (origin !== file && (adapterFiles.has(origin) || kindByFile.get(origin) === 'proxy')) {
          importers.set(origin, (importers.get(origin) ?? new Set<CensusPath>()).add(file));
        }
      }
    }
  }

  return new Map([...importers].map(([origin, files]) => [origin, [...files].sort()]));
};
