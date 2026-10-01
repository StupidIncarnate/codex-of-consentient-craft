/**
 * PURPOSE: Reads a gateway WRAPPER file's own source text (a function/schema implementation, an
 * `.error.ts` companion, a destructured global capture like `process/argv/argv.ts`'s
 * `export const { argv } = process;`, or a type-only companion beside it) and splits its top-level
 * exports into VALUE names (a `const`, `function` or `class` declaration, or each name a
 * destructured global capture binds — what a barrel's completeness check must re-export) and TYPE
 * names (a `type` or `interface` declaration — never required, but still a real name a barrel's
 * existing re-export can validly point at). barrel-completeness-layer-broker reads sibling files
 * the current lint pass never visits, so this parses their text with TypeScript and reads only the
 * top-level export declarations. Text inside a comment or a string is never an export.
 *
 * USAGE:
 * gatewayWrapperExportedNamesTransformer({ sourceText: 'export const readFileSync = () => "";' });
 * // Returns { valueNames: ['readFileSync'], typeNames: [] }
 */
import * as ts from '#gateway/npm/typescript';

export const gatewayWrapperExportedNamesTransformer = ({
  sourceText,
}: {
  sourceText: string;
}): { valueNames: string[]; typeNames: string[] } => {
  const file = ts.createSourceFile(
    'gateway-wrapper.ts',
    sourceText,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS,
  );
  const valueNames = new Set<string>();
  const typeNames = new Set<string>();

  file.statements.forEach((statement) => {
    const isExported =
      ts.canHaveModifiers(statement) &&
      (ts.getModifiers(statement) ?? []).some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      );

    if (!isExported) {
      return;
    }

    if (ts.isVariableStatement(statement)) {
      statement.declarationList.declarations.forEach((declaration) => {
        const { name } = declaration;
        if (ts.isIdentifier(name)) {
          valueNames.add(name.text);
          return;
        }
        name.elements.forEach((element) => {
          if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) {
            valueNames.add(element.name.text);
          }
        });
      });
      return;
    }

    if (
      (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
      statement.name !== undefined
    ) {
      valueNames.add(statement.name.text);
      return;
    }

    if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
      typeNames.add(statement.name.text);
    }
  });

  return { valueNames: Array.from(valueNames), typeNames: Array.from(typeNames) };
};
