/**
 * PURPOSE: Reduces one top-level statement to the names it exports on its own — an `export const`/
 * `function`/`class`/`type`/`interface`/`enum` declaration's own name, or the names in a local
 * `export { a, b };` re-export of already-declared bindings. Returns nothing for a statement that
 * declares no export at all.
 *
 * USAGE:
 * localExportNamesFromStatementLayerAdapter({ node: someExportedVariableStatement });
 * // Returns: ['userFetchBroker']
 */

import * as ts from 'typescript';
import {
  exportedNameContract,
  type ExportedName,
} from '../../../contracts/exported-name/exported-name-contract';
import { hasExportModifierLayerAdapter } from './has-export-modifier-layer-adapter';

export const localExportNamesFromStatementLayerAdapter = ({
  node,
}: {
  node: ts.Statement;
}): readonly ExportedName[] => {
  if (!hasExportModifierLayerAdapter({ node })) {
    if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier === undefined &&
      node.exportClause !== undefined &&
      ts.isNamedExports(node.exportClause)
    ) {
      return node.exportClause.elements.map((element) =>
        exportedNameContract.parse(element.name.text),
      );
    }
    return [];
  }

  if (ts.isVariableStatement(node)) {
    return node.declarationList.declarations
      .map((declaration) => (ts.isIdentifier(declaration.name) ? declaration.name.text : undefined))
      .filter((name): name is NonNullable<typeof name> => name !== undefined)
      .map((name) => exportedNameContract.parse(name));
  }

  if (
    (ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isEnumDeclaration(node)) &&
    node.name !== undefined
  ) {
    return [exportedNameContract.parse(node.name.text)];
  }

  return [];
};
