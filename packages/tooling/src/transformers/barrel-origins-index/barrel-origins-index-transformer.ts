/**
 * PURPOSE: Maps every name a barrel file exports to the file that defines it, following `export *`
 * and `export { a } from` chains through nested barrels. A caller imports an adapter through a
 * package-root barrel (`@scope/pkg/adapters`), so without this index a caller and its adapter never
 * meet. Built once per barrel; a name the barrel defines itself maps to the barrel.
 *
 * USAGE:
 * barrelOriginsIndexTransformer({ file, factsByFile, knownFiles, packages }).get('readFileAdapter');
 * // Returns the CensusPath of the adapter file the barrel re-exports it from
 */
import { importTargetResolveTransformer } from '../import-target-resolve/import-target-resolve-transformer';
import { censusLayoutStatics } from '../../statics/census-layout/census-layout-statics';
import type { CensusPath } from '../../contracts/census-path/census-path-contract';
import type { CensusPackage } from '../../contracts/census-package/census-package-contract';
import type { ExportName } from '../../contracts/export-name/export-name-contract';
import type { SourceFacts } from '../../contracts/source-facts/source-facts-contract';

export const barrelOriginsIndexTransformer = ({
  file,
  factsByFile,
  knownFiles,
  packages,
  depth = 0,
}: {
  file: CensusPath;
  factsByFile: ReadonlyMap<CensusPath, SourceFacts>;
  knownFiles: ReadonlySet<CensusPath>;
  packages: readonly CensusPackage[];
  depth?: number;
}): ReadonlyMap<ExportName, CensusPath> => {
  const facts = factsByFile.get(file);
  const index = new Map<ExportName, CensusPath>();

  if (facts === undefined || depth > censusLayoutStatics.barrelDepthLimit) {
    return index;
  }

  for (const reExport of facts.reExports) {
    const target = importTargetResolveTransformer({
      fromFile: file,
      specifier: reExport.specifier,
      knownFiles,
      packages,
    });
    if (target === null) {
      continue;
    }
    const targetFacts = factsByFile.get(target);
    const nested =
      targetFacts !== undefined && targetFacts.reExports.length > 0
        ? barrelOriginsIndexTransformer({
            file: target,
            factsByFile,
            knownFiles,
            packages,
            depth: depth + 1,
          })
        : new Map<ExportName, CensusPath>();
    const names = reExport.isStar
      ? [...(targetFacts?.exportNames ?? []), ...nested.keys()]
      : reExport.names;

    for (const name of names) {
      index.set(name, nested.get(name) ?? target);
    }
  }

  for (const name of facts.exportNames) {
    index.set(name, file);
  }

  return index;
};
