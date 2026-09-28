/**
 * PURPOSE: Reduces one `ExportDeclaration` node that carries a `moduleSpecifier` (a re-export) to
 * the `ModuleDependency` shape the walk needs — `star` for `export * from 'x'`, `named` for
 * `export {a, b} from 'x'`, `opaque` for `export * as ns from 'x'` (a namespace re-export names
 * nothing specific).
 *
 * USAGE:
 * exportDependencyFromDeclarationLayerTransformer({ node: someExportDeclaration });
 * // Returns: { specifier: 'x', kind: 'star', importedNames: [] } or undefined for a non-string-literal specifier
 */

import * as ts from '#gateway/npm/typescript';
import {
  moduleDependencyContract,
  type ModuleDependency,
} from '../../contracts/module-dependency/module-dependency-contract';

export const exportDependencyFromDeclarationLayerTransformer = ({
  node,
}: {
  node: ts.ExportDeclaration;
}): ModuleDependency | undefined => {
  if (node.moduleSpecifier === undefined || !ts.isStringLiteral(node.moduleSpecifier)) {
    return undefined;
  }
  const specifier = node.moduleSpecifier.text;

  if (node.exportClause === undefined) {
    return moduleDependencyContract.parse({ specifier, kind: 'star', importedNames: [] });
  }

  if (ts.isNamedExports(node.exportClause)) {
    return moduleDependencyContract.parse({
      specifier,
      kind: 'named',
      importedNames: node.exportClause.elements.map((element) => element.name.text),
    });
  }

  // `export * as ns from 'x'` — a namespace re-export names nothing specific.
  return moduleDependencyContract.parse({ specifier, kind: 'opaque', importedNames: [] });
};
