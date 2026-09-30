/**
 * PURPOSE: Reads a file's top-level statements for the imports, re-exports and defined names the
 * census resolves later. A type-only import or export is skipped: it is never a caller.
 * `export { a as b } from` records `b`, the name an importer sees.
 *
 * USAGE:
 * sourceFactsExtractStatementsLayerBroker({ sourceFile });
 * // Returns { imports, reExports, exportNames }
 */
import * as ts from '#gateway/npm/typescript';
import type { SourceFacts } from '../../../contracts/source-facts/source-facts-contract';
import { sourceFactsContract } from '../../../contracts/source-facts/source-facts-contract';

export const sourceFactsExtractStatementsLayerBroker = ({
  sourceFile,
}: {
  sourceFile: ts.SourceFile;
}): Omit<SourceFacts, 'catchAllSites'> => {
  const imports: SourceFacts['imports'] = [];
  const reExports: SourceFacts['reExports'] = [];
  const exportNames: SourceFacts['exportNames'] = [];

  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const clause = statement.importClause;
      const bindings = clause?.namedBindings;
      if (clause?.isTypeOnly !== true) {
        const named =
          bindings !== undefined && ts.isNamedImports(bindings)
            ? bindings.elements
                .filter((element) => !element.isTypeOnly)
                .map((element) => (element.propertyName ?? element.name).text)
            : [];
        imports.push({
          specifier: statement.moduleSpecifier.text,
          names: [
            ...(clause?.name === undefined ? [] : ['default']),
            ...(bindings !== undefined && ts.isNamespaceImport(bindings) ? ['*'] : []),
            ...named,
          ].map((name) => name),
        });
      }
    } else if (ts.isExportDeclaration(statement) && !statement.isTypeOnly) {
      const clause = statement.exportClause;
      const names =
        clause !== undefined && ts.isNamedExports(clause)
          ? clause.elements
              .filter((element) => !element.isTypeOnly)
              .map((element) => element.name.text)
          : [];
      if (
        statement.moduleSpecifier !== undefined &&
        ts.isStringLiteral(statement.moduleSpecifier)
      ) {
        reExports.push({
          specifier: statement.moduleSpecifier.text,
          names:
            clause !== undefined && ts.isNamespaceExport(clause)
              ? [clause.name.text]
              : names,
          isStar: clause === undefined,
        });
      } else {
        exportNames.push(sourceFactsContract.shape.exportNames.parse(sourceFactsContract.shape.exportNames.parse(sourceFactsContract.shape.exportNames.parse(...names))));
      }
    } else if (ts.isExportAssignment(statement)) {
      exportNames.push(sourceFactsContract.shape.exportNames.parse(sourceFactsContract.shape.exportNames.parse(sourceFactsContract.shape.exportNames.parse('default'))));
    } else if (
      ts.canHaveModifiers(statement) &&
      (ts.getModifiers(statement) ?? []).some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      const declared = ts.isVariableStatement(statement)
        ? statement.declarationList.declarations.flatMap((declaration) =>
            ts.isIdentifier(declaration.name) ? [declaration.name.text] : [],
          )
        : [];
      const named =
        ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isEnumDeclaration(statement)
          ? [statement.name?.text ?? 'default']
          : [];
      exportNames.push(sourceFactsContract.shape.exportNames.parse(sourceFactsContract.shape.exportNames.parse(sourceFactsContract.shape.exportNames.parse(...[...declared, ...named].map((name) => name)))));
    }
  }

  return sourceFactsContract.parse({ imports, reExports, exportNames: [...new Set(exportNames)] });
};
