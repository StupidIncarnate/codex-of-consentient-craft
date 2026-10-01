/**
 * PURPOSE: Follows an imported name from the importing file, through any number of `export ... from`
 * barrels, to the `-contract.ts` file it lands on. Reach for this over resolving the specifier alone,
 * since a workspace package hands its contracts out through a root barrel.
 *
 * A contract file answers only for a name it exports as a const: a star barrel lists hundreds of
 * contract files, and the first one it reaches is not the one that holds `name`. `resolvedTargets`
 * remembers each (file, specifier) resolution across calls (null for none), since a star barrel's
 * links are resolved again for every name looked up through it; `foundTargets` remembers each
 * barrel-and-name search that starts with nothing visited, since many files import one name from one
 * barrel.
 *
 * USAGE:
 * contractFileFindLayerTransformer({ specifier, fromFile, name, contractFiles, exportedNamesByFile, reExportsByFile, knownFiles, packages, resolvedTargets: new Map(), foundTargets: new Map() });
 * // Returns the contract file's AbsoluteFilePath, or undefined when the name lands on no contract file
 */
import type { ContractIndexPackage } from '../../contracts/contract-index-package/contract-index-package-contract';
import type { ContractIndexFileRead } from '../../contracts/contract-index-file-read/contract-index-file-read-contract';
import { moduleSpecifierResolveLayerTransformer } from './module-specifier-resolve-layer-transformer';

export const contractFileFindLayerTransformer = ({
  specifier,
  fromFile,
  name,
  contractFiles,
  exportedNamesByFile,
  reExportsByFile,
  knownFiles,
  packages,
  resolvedTargets,
  foundTargets,
  visited = [],
}: {
  specifier: string;
  fromFile: string;
  name: string;
  contractFiles: ReadonlySet<string>;
  exportedNamesByFile: ReadonlyMap<string, readonly string[]>;
  reExportsByFile: ReadonlyMap<string, ContractIndexFileRead['reExports']>;
  knownFiles: ReadonlySet<string>;
  packages: ContractIndexPackage[];
  resolvedTargets: Map<string, string | null>;
  foundTargets: Map<string, string | null>;
  visited?: readonly string[];
}): string | undefined => {
  const resolveKey = `${fromFile}\0${specifier}`;
  const remembered = resolvedTargets.get(resolveKey);
  const resolved =
    remembered === undefined
      ? (moduleSpecifierResolveLayerTransformer({ specifier, fromFile, knownFiles, packages }) ??
        null)
      : remembered;
  resolvedTargets.set(resolveKey, resolved);
  const target = resolved ?? undefined;

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

  // Only a search that starts here (nothing visited yet) depends on (target, name) alone.
  const found = visited.length === 0 ? foundTargets.get(visitKey) : undefined;
  if (found !== undefined) {
    return found ?? undefined;
  }

  const searched = (reExportsByFile.get(target) ?? []).reduce<string | undefined>(
    (result, link) => {
      if (result !== undefined || (link.kind === 'named' && link.exportedName !== name)) {
        return result;
      }
      return contractFileFindLayerTransformer({
        specifier: link.specifier,
        fromFile: target,
        name: link.kind === 'star' ? name : link.sourceName,
        contractFiles,
        exportedNamesByFile,
        reExportsByFile,
        knownFiles,
        packages,
        resolvedTargets,
        foundTargets,
        visited: [...visited, visitKey],
      });
    },
    undefined,
  );
  if (visited.length === 0) {
    foundTargets.set(visitKey, searched ?? null);
  }
  return searched;
};
