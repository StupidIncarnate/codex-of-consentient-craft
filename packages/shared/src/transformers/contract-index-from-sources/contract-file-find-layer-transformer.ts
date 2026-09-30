/**
 * PURPOSE: Follows an imported name from the importing file, through any number of `export ... from`
 * barrels, to the `-contract.ts` file it lands on. Reach for this over resolving the specifier alone,
 * since a workspace package hands its contracts out through a root barrel.
 *
 * A contract file answers only for a name it exports as a const: a star barrel lists hundreds of
 * contract files, and the first one it reaches is not the one that holds `name`.
 *
 * USAGE:
 * contractFileFindLayerTransformer({ specifier, fromFile, name, contractFiles, exportedNamesByFile, reExportsByFile, knownFiles, packages });
 * // Returns the contract file's AbsoluteFilePath, or undefined when the name lands on no contract file
 */
import type { ContractIndexPackage } from '../../contracts/contract-index-package/contract-index-package-contract';
import { moduleSpecifierResolveLayerTransformer } from './module-specifier-resolve-layer-transformer';
import type { moduleLinksReadLayerTransformer } from './module-links-read-layer-transformer';

export const contractFileFindLayerTransformer = ({
  specifier,
  fromFile,
  name,
  contractFiles,
  exportedNamesByFile,
  reExportsByFile,
  knownFiles,
  packages,
  visited = [],
}: {
  specifier: string;
  fromFile: string;
  name: string;
  contractFiles: ReadonlySet<string>;
  exportedNamesByFile: ReadonlyMap<string, readonly string[]>;
  reExportsByFile: ReadonlyMap<
    string,
    ReturnType<typeof moduleLinksReadLayerTransformer>['reExports']
  >;
  knownFiles: ReadonlySet<string>;
  packages: ContractIndexPackage[];
  visited?: readonly string[];
}): string | undefined => {
  const target = moduleSpecifierResolveLayerTransformer({
    specifier,
    fromFile,
    knownFiles,
    packages,
  });

  if (target === undefined) {
    return undefined;
  }

  if (contractFiles.has(target)) {
    return exportedNamesByFile.get(target)?.includes(name) === true ? target : undefined;
  }

  const visitKey = `${target}\0${name}`;
  if (visited.includes(visitKey)) {
    return undefined;
  }

  for (const link of reExportsByFile.get(target) ?? []) {
    if (link.kind === 'named' && link.exportedName !== name) {
      continue;
    }
    const found = contractFileFindLayerTransformer({
      specifier: link.specifier,
      fromFile: target,
      name: link.kind === 'star' ? name : link.sourceName,
      contractFiles,
      exportedNamesByFile,
      reExportsByFile,
      knownFiles,
      packages,
      visited: [...visited, visitKey],
    });
    if (found !== undefined) {
      return found;
    }
  }

  return undefined;
};
