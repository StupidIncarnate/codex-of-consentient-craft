/**
 * PURPOSE: Reads a file's named imports and its `export ... from` links, the two edges the contract
 * index follows to find which contract file a name lands on through package barrels.
 *
 * USAGE:
 * moduleLinksReadLayerTransformer({ sourceFile });
 * // Returns { imports: [{ localName, importedName, specifier, isTypeOnly }], reExports: [{ kind, exportedName, sourceName, specifier }] }
 */
import * as ts from '#gateway/npm/typescript';

import { importPathContract } from '../../contracts/import-path/import-path-contract';
import type { ImportPath } from '../../contracts/import-path/import-path-contract';

export const moduleLinksReadLayerTransformer = ({
  sourceFile,
}: {
  sourceFile: ts.SourceFile;
}): {
  imports: {
    localName: string;
    importedName: string;
    specifier: ImportPath;
    isTypeOnly: boolean;
  }[];
  reExports: {
    kind: 'star' | 'named';
    exportedName: string;
    sourceName: string;
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
            localName: element.name.text,
            importedName: (element.propertyName ?? element.name).text,
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
          exportedName: '*',
          sourceName: '*',
          specifier,
        });
      } else if (ts.isNamedExports(clause)) {
        for (const element of clause.elements) {
          reExports.push({
            kind: 'named',
            exportedName: element.name.text,
            sourceName: (element.propertyName ?? element.name).text,
            specifier,
          });
        }
      }
    }
  }

  return { imports, reExports };
};
