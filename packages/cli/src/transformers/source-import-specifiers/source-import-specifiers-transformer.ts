/**
 * PURPOSE: Every module specifier one TypeScript source file's top-level statements import,
 * re-export from, or `import x = require(...)`, read from the parsed AST rather than a regex — so an
 * import written inside a string literal (a stub's default code sample, `"import a from 'x';"`) is
 * text, not a dependency, and never reads as one. A `require()` or `import()` call inside a function
 * body is not read.
 *
 * USAGE:
 * sourceImportSpecifiersTransformer({ sourceText: "import { z } from 'zod';" });
 * // Returns ['zod']
 */

import * as ts from '#gateway/npm/typescript';

const SCAN_FILE_NAME = 'scanned.ts';

export const sourceImportSpecifiersTransformer = ({
  sourceText,
}: {
  sourceText: string;
}): readonly string[] =>
  ts
    .createSourceFile(SCAN_FILE_NAME, sourceText, ts.ScriptTarget.Latest, false)
    .statements.flatMap((statement) => {
      if (ts.isImportDeclaration(statement) || ts.isExportDeclaration(statement)) {
        const { moduleSpecifier } = statement;
        return moduleSpecifier !== undefined && ts.isStringLiteral(moduleSpecifier)
          ? [moduleSpecifier.text]
          : [];
      }
      if (statement.kind !== ts.SyntaxKind.ImportEqualsDeclaration) {
        return [];
      }
      const specifier = ts.forEachChild(statement, (child) =>
        child.kind === ts.SyntaxKind.ExternalModuleReference
          ? ts.forEachChild(child, (literal) =>
              ts.isStringLiteral(literal) ? literal.text : undefined,
            )
          : undefined,
      );
      return specifier === undefined ? [] : [specifier];
    });
