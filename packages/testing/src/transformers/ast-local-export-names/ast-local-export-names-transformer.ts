/**
 * PURPOSE: Extracts the names a file exports through its OWN top-level declarations — `export const`,
 * `export function`, `export class`, and a bare `export { name }` with no `from` clause. A re-export
 * edge (`export ... from './x'`) is NOT a local name; `astProxyImportsTransformer` reports
 * those separately, since resolving one means following into `./x` rather than reading a name here.
 *
 * USAGE:
 * const names = astLocalExportNamesTransformer({sourceFile});
 * // Returns e.g. ['pathJoinAdapterProxy']
 */

import * as ts from '#gateway/npm/typescript';

export const astLocalExportNamesTransformer = ({
  sourceFile,
}: {
  sourceFile: ts.SourceFile;
}): string[] => {
  const tsSourceFile = sourceFile as unknown as ts.SourceFile;
  const names: string[] = [];

  for (const statement of tsSourceFile.statements) {
    const hasExportModifier = (
      ts.canHaveModifiers(statement) ? ts.getModifiers(statement) : undefined
    )?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);

    if (hasExportModifier && ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          names.push(declaration.name.text);
        }
      }
    }

    if (
      hasExportModifier &&
      (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
      statement.name
    ) {
      names.push(statement.name.text);
    }

    if (
      ts.isExportDeclaration(statement) &&
      !statement.moduleSpecifier &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        names.push(element.name.text);
      }
    }
  }

  return names;
};
