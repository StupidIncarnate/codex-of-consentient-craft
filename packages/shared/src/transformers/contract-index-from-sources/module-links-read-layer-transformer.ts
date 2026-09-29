/**
 * PURPOSE: Reads a file's named imports and its `export ... from` links, the two edges the contract
 * index follows to find which contract file a name lands on through package barrels.
 *
 * USAGE:
 * moduleLinksReadLayerTransformer({ sourceFile });
 * // Returns { imports: [{ localName, importedName, specifier, isTypeOnly }], reExports: [{ kind, exportedName, sourceName, specifier }] }
 */
import * as ts from '#gateway/npm/typescript';

import { identifierContract } from '../../contracts/identifier/identifier-contract';
import type { Identifier } from '../../contracts/identifier/identifier-contract';
import { importPathContract } from '../../contracts/import-path/import-path-contract';
import type { ImportPath } from '../../contracts/import-path/import-path-contract';

export const moduleLinksReadLayerTransformer = ({
  sourceFile,
}: {
  sourceFile: ts.SourceFile;
}): {
  imports: {
    localName: Identifier;
    importedName: Identifier;
    specifier: ImportPath;
    isTypeOnly: boolean;
  }[];
  reExports: {
    kind: 'star' | 'named';
    exportedName: Identifier;
    sourceName: Identifier;
    specifier: ImportPath;
  }[];
} => {
  const imports: ReturnType<typeof moduleLinksReadLayerTransformer>['imports'] = [];
  const reExports: ReturnType<typeof moduleLinksReadLayerTransformer>['reExports'] = [];

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const clause = statement.importClause;
      const bindings = clause?.namedBindings;
      if (clause !== undefined && bindings !== undefined && ts.isNamedImports(bindings)) {
        for (const element of bindings.elements) {
          imports.push({
            localName: identifierContract.parse(element.name.text),
            importedName: identifierContract.parse((element.propertyName ?? element.name).text),
            specifier: importPathContract.parse(statement.moduleSpecifier.text),
            isTypeOnly: clause.isTypeOnly || element.isTypeOnly,
          });
        }
      }
    } else if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier !== undefined &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      const specifier = importPathContract.parse(statement.moduleSpecifier.text);
      const clause = statement.exportClause;
      if (clause === undefined) {
        reExports.push({
          kind: 'star',
          exportedName: identifierContract.parse('*'),
          sourceName: identifierContract.parse('*'),
          specifier,
        });
      } else if (ts.isNamedExports(clause)) {
        for (const element of clause.elements) {
          reExports.push({
            kind: 'named',
            exportedName: identifierContract.parse(element.name.text),
            sourceName: identifierContract.parse((element.propertyName ?? element.name).text),
            specifier,
          });
        }
      }
    }
  }

  return { imports, reExports };
};
