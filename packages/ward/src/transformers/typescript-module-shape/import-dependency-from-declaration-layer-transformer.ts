/**
 * PURPOSE: Reduces one `ImportDeclaration` node to the `ModuleDependency` shape the walk needs —
 * `named` for `import {a, b} from 'x'` (value or type-only alike), `opaque` for a default import, a
 * namespace import, or a bare side-effect import, since none of those name which bindings are used.
 *
 * USAGE:
 * importDependencyFromDeclarationLayerTransformer({ node: someImportDeclaration });
 * // Returns: { specifier: 'x', kind: 'named', importedNames: ['a', 'b'] } or undefined for a non-string-literal specifier
 */

import * as ts from '#gateway/npm/typescript';
import {
  moduleDependencyContract,
  type ModuleDependency,
} from '../../contracts/module-dependency/module-dependency-contract';

export const importDependencyFromDeclarationLayerTransformer = ({
  node,
}: {
  node: ts.ImportDeclaration;
}): ModuleDependency | undefined => {
  if (!ts.isStringLiteral(node.moduleSpecifier)) {
    return undefined;
  }
  const specifier = node.moduleSpecifier.text;

  if (node.importClause === undefined) {
    return moduleDependencyContract.parse({ specifier, kind: 'opaque', importedNames: [] });
  }

  const { namedBindings } = node.importClause;
  if (namedBindings !== undefined && ts.isNamedImports(namedBindings)) {
    return moduleDependencyContract.parse({
      specifier,
      kind: 'named',
      importedNames: namedBindings.elements.map((element) => element.name.text),
    });
  }

  return moduleDependencyContract.parse({ specifier, kind: 'opaque', importedNames: [] });
};
