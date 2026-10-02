/**
 * PURPOSE: Reads a file's named imports and its `export ... from` links, the two edges the contract
 * index follows to find which contract file a name lands on through package barrels.
 *
 * USAGE:
 * moduleLinksReadLayerTransformer({ sourceFile });
 * // Returns { imports: [{ localName, importedName, specifier, isTypeOnly }], reExports: [{ kind, exportedName, sourceName, specifier }] }
 */
import * as ts from '#gateway/npm/typescript';
import { isTypeOnlyImportClauseGuard } from '../../guards/is-type-only-import-clause/is-type-only-import-clause-guard';

export const moduleLinksReadLayerTransformer = ({
  sourceFile,
}: {
  sourceFile: ts.SourceFile;
}): {
  imports: {
    localName: string;
    importedName: string;
    specifier: string;
    isTypeOnly: boolean;
  }[];
  reExports: {
    kind: 'star' | 'named';
    exportedName: string;
    sourceName: string;
    specifier: string;
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
            specifier: statement.moduleSpecifier.text,
            isTypeOnly: isTypeOnlyImportClauseGuard({ clause }) || element.isTypeOnly,
          });
        }
      }
    } else if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier !== undefined &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      const specifier = statement.moduleSpecifier.text;
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
