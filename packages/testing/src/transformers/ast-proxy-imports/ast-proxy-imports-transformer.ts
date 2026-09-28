/**
 * PURPOSE: Extracts import/export-from edges that target `.proxy` files or a workspace package's own
 * testing barrel, along with the names each edge actually carries. An `import` edge is a plain
 * `import ... from` — the current file's own dependency, always followed in full. A `reexport` edge is
 * an `export ... from` — part of the CURRENT file's own re-export surface, and the collector prunes
 * those by name so a barrel's fan-out only pulls in the proxy modules an importer actually asked for.
 * `names: null` marks an edge with no explicit name list (`export * from`, `import * as ns from`),
 * which must be treated as "everything this module exports".
 *
 * USAGE:
 * const edges = astProxyImportsTransformer({sourceFile});
 * // Returns e.g. [{kind: 'import', importPath: './test.proxy', names: ['adapterProxy']}]
 */

import * as ts from '#gateway/npm/typescript';
import { isProxyImportGuard } from '../../guards/is-proxy-import/is-proxy-import-guard';
import { importPathContract } from '../../contracts/import-path/import-path-contract';
import { identifierNameContract } from '../../contracts/identifier-name/identifier-name-contract';
import { proxyImportEdgeContract } from '../../contracts/proxy-import-edge/proxy-import-edge-contract';
import type { ProxyImportEdge } from '../../contracts/proxy-import-edge/proxy-import-edge-contract';
import type { TypescriptSourceFile } from '../../contracts/typescript-source-file/typescript-source-file-contract';

export const astProxyImportsTransformer = ({
  sourceFile,
}: {
  sourceFile: TypescriptSourceFile;
}): ProxyImportEdge[] => {
  const tsSourceFile = sourceFile as unknown as ts.SourceFile;
  const edges: ProxyImportEdge[] = [];
  const nodesToVisit: ts.Node[] = [tsSourceFile];

  while (nodesToVisit.length > 0) {
    const node = nodesToVisit.pop();
    if (!node) {
      continue;
    }

    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const importPath = node.moduleSpecifier.text;
      if (isProxyImportGuard({ importPath })) {
        const { importClause } = node;
        const namedBindings = importClause?.namedBindings;
        const names =
          namedBindings && ts.isNamedImports(namedBindings)
            ? namedBindings.elements
                .filter((element) => !element.isTypeOnly)
                .map((element) =>
                  identifierNameContract.parse((element.propertyName ?? element.name).text),
                )
            : null;
        edges.push(
          proxyImportEdgeContract.parse({
            kind: 'import',
            importPath: importPathContract.parse(importPath),
            names,
          }),
        );
      }
    }

    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const importPath = node.moduleSpecifier.text;
      if (isProxyImportGuard({ importPath })) {
        const { exportClause } = node;
        const names =
          exportClause && ts.isNamedExports(exportClause)
            ? exportClause.elements
                .filter((element) => !element.isTypeOnly)
                .map((element) =>
                  identifierNameContract.parse((element.propertyName ?? element.name).text),
                )
            : null;
        edges.push(
          proxyImportEdgeContract.parse({
            kind: 'reexport',
            importPath: importPathContract.parse(importPath),
            names,
          }),
        );
      }
    }

    ts.forEachChild(node, (child: ts.Node) => {
      nodesToVisit.push(child);
    });
  }

  return edges;
};
