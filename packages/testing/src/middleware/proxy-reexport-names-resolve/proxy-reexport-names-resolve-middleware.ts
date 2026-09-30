/**
 * PURPOSE: Given a module and a set of candidate export names, returns the subset the module actually
 * provides — following its OWN `export * from` / `export {...} from` edges the same way Node resolves a
 * star re-export, so a barrel's fan-out is pruned to only the sub-modules that really define a
 * requested name instead of every file the barrel re-exports. Recursion (not a growing worklist) is
 * what walks the re-export graph here, because each edge narrows to a strictly smaller candidate set,
 * bounding the depth; `visitedFiles` still guards a cycle between two barrels re-exporting each other.
 *
 * USAGE:
 * const provided = proxyReexportNamesResolveMiddleware({
 *   filePath: barrelPath,
 *   candidateNames: ['pathJoinAdapterProxy'],
 *   program,
 * });
 * // Returns the names of `candidateNames` that barrelPath (transitively) exports
 */

import { typescriptSourceFileGetMiddleware } from '../typescript-source-file-get/typescript-source-file-get-middleware';
import { astLocalExportNamesTransformer } from '../../transformers/ast-local-export-names/ast-local-export-names-transformer';
import { astProxyImportsTransformer } from '../../transformers/ast-proxy-imports/ast-proxy-imports-transformer';
import { importPathResolverMiddleware } from '../import-path-resolver/import-path-resolver-middleware';
import type * as ts from '#gateway/npm/typescript';

export const proxyReexportNamesResolveMiddleware = ({
  filePath,
  candidateNames,
  program,
  visitedFiles = new Set<string>(),
}: {
  filePath: string;
  candidateNames: string[];
  program: ts.Program | undefined;
  visitedFiles?: Set<string>;
}): string[] => {
  if (candidateNames.length === 0 || visitedFiles.has(filePath)) {
    return [];
  }
  visitedFiles.add(filePath);

  const sourceFile = typescriptSourceFileGetMiddleware({ program, filePath });
  if (!sourceFile) {
    return [];
  }

  const localNames = new Set(astLocalExportNamesTransformer({ sourceFile }));
  const found = candidateNames.filter((name) => localNames.has(name));
  const stillRemaining = new Set(candidateNames.filter((name) => !localNames.has(name)));

  if (stillRemaining.size === 0) {
    return found;
  }

  const reexportEdges = astProxyImportsTransformer({ sourceFile }).filter(
    (edge) => edge.kind === 'reexport',
  );

  for (const edge of reexportEdges) {
    if (stillRemaining.size === 0) {
      break;
    }

    const namesToCheck =
      edge.names === null
        ? [...stillRemaining]
        : edge.names.filter((name) => stillRemaining.has(name));
    if (namesToCheck.length === 0) {
      continue;
    }

    const childPath = importPathResolverMiddleware({
      sourceFilePath: filePath,
      importPath: edge.importPath,
    });
    if (!childPath) {
      continue;
    }

    const childFound = proxyReexportNamesResolveMiddleware({
      filePath: childPath,
      candidateNames: namesToCheck,
      program,
      visitedFiles,
    });
    for (const name of childFound) {
      found.push(name);
      stillRemaining.delete(name);
    }
  }

  return found;
};
