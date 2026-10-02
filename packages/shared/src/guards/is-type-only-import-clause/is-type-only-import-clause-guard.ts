/**
 * PURPOSE: Answers whether an import clause is `import type …`, on whichever TypeScript parsed it.
 * TypeScript 6 records that as `phaseModifier` and deprecates `isTypeOnly`; TypeScript 5 has only
 * `isTypeOnly`. Reach for this over either field wherever the AST can come from a consumer's own
 * TypeScript — a ts-jest transform, a read of the consumer's source — since a consumer may still be
 * on 5.
 *
 * USAGE:
 * isTypeOnlyImportClauseGuard({ clause: statement.importClause });
 * // Returns true for `import type { X } from 'x'`; false for `import { X } from 'x'` or no clause
 */
import * as ts from '#gateway/npm/typescript';

export const isTypeOnlyImportClauseGuard = ({ clause }: { clause?: ts.ImportClause }): boolean => {
  if (clause === undefined) {
    return false;
  }

  // TypeScript 5 parsed this clause when it carries no `phaseModifier`; its `isTypeOnly` is read by
  // name because the TypeScript 6 types mark it deprecated, though 6 still sets it.
  return clause.phaseModifier === ts.SyntaxKind.TypeKeyword || Reflect.get(clause, 'isTypeOnly');
};
