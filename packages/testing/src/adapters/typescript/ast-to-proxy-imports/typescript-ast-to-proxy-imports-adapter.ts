/**
 * PURPOSE: Extracts import paths to .proxy files from TypeScript AST
 *
 * USAGE:
 * const proxyImports = typescriptAstToProxyImportsAdapter({sourceFile});
 * // Returns array of import paths that include '.proxy'
 */

import * as ts from 'typescript';
import { isProxyImportGuard } from '../../../guards/is-proxy-import/is-proxy-import-guard';
import { importPathContract } from '../../../contracts/import-path/import-path-contract';
import type { ImportPath } from '../../../contracts/import-path/import-path-contract';
import type { TypescriptSourceFile } from '../../../contracts/typescript-source-file/typescript-source-file-contract';

export const typescriptAstToProxyImportsAdapter = ({
  sourceFile,
}: {
  sourceFile: TypescriptSourceFile;
}): ImportPath[] => {
  const tsSourceFile = sourceFile as unknown as ts.SourceFile;
  const proxyImports: ImportPath[] = [];
  const nodesToVisit: ts.Node[] = [tsSourceFile];

  while (nodesToVisit.length > 0) {
    const node = nodesToVisit.pop();
    if (!node) {
      continue;
    }

    if (ts.isImportDeclaration(node)) {
      const { moduleSpecifier } = node;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;
        if (isProxyImportGuard({ importPath })) {
          proxyImports.push(importPathContract.parse(importPath));
        }
      }
    }

    ts.forEachChild(node, (child: ts.Node) => {
      nodesToVisit.push(child);
    });
  }

  return proxyImports;
};
