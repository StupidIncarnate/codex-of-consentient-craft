/**
 * PURPOSE: Locates `compilerOptions.paths` inside a JSONC tsconfig string via TypeScript's own
 * `parseJsonText` — the same tolerant scanner `tsc` itself uses for tsconfig files, so comments and
 * trailing commas parse without choking. Node positions it hands back (`getStart`/`getEnd`) are real
 * character offsets into the ORIGINAL text, comments included as skipped trivia, which is what lets
 * `tsconfigPathsInsertTextTransformer` splice new entries in without disturbing a single comment
 * elsewhere in the file — no hand-rolled JSONC lexer needed for a repo that already ships `typescript`.
 *
 * USAGE:
 * typescriptTsconfigPathsLocateAdapter({ text: '{"compilerOptions": {"paths": {}}}' });
 * // Returns { situation: 'missingPaths', insertPos, indent, needsLeadingComma }
 */

import * as ts from 'typescript';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { tsconfigPathsLocateResultContract } from '../../../contracts/tsconfig-paths-locate-result/tsconfig-paths-locate-result-contract';
import type { TsconfigPathsLocateResult } from '../../../contracts/tsconfig-paths-locate-result/tsconfig-paths-locate-result-contract';
import { isWhitespaceOnlyGuard } from '../../../guards/is-whitespace-only/is-whitespace-only-guard';

export const typescriptTsconfigPathsLocateAdapter = ({
  text,
}: {
  text: string;
}): TsconfigPathsLocateResult => {
  const sourceFile = ts.parseJsonText(locationsStatics.repoRoot.tsconfig, text);
  const rootExpression = sourceFile.statements[0]?.expression;
  const rootProperties =
    rootExpression !== undefined && ts.isObjectLiteralExpression(rootExpression)
      ? rootExpression.properties
      : [];

  const [compilerOptionsMatch] = rootProperties.flatMap((property) =>
    ts.isPropertyAssignment(property) &&
    ts.isStringLiteral(property.name) &&
    property.name.text === 'compilerOptions' &&
    ts.isObjectLiteralExpression(property.initializer)
      ? [[property, property.initializer] as const]
      : [],
  );

  if (compilerOptionsMatch === undefined) {
    return tsconfigPathsLocateResultContract.parse({ situation: 'missingCompilerOptions' });
  }

  const [compilerOptionsProperty, compilerOptionsObject] = compilerOptionsMatch;

  const [pathsMatch] = compilerOptionsObject.properties.flatMap((property) =>
    ts.isPropertyAssignment(property) &&
    ts.isStringLiteral(property.name) &&
    property.name.text === 'paths' &&
    ts.isObjectLiteralExpression(property.initializer)
      ? [[property, property.initializer] as const]
      : [],
  );

  const [targetProperty, targetObject] = pathsMatch ?? [
    compilerOptionsProperty,
    compilerOptionsObject,
  ];

  // Measured from the PROPERTY's own start (the key, e.g. `"paths"`), never the object literal's
  // own `{` — that brace sits mid-line after the key, so measuring from it would capture
  // `  "paths": ` as the "indent" and fail the whitespace-only check below on every real file.
  const targetPropertyStart = targetProperty.getStart(sourceFile);
  const targetLineStart = text.lastIndexOf('\n', targetPropertyStart) + 1;
  const leadingWhitespaceCandidate = text.slice(targetLineStart, targetPropertyStart);
  const targetLineIndent = isWhitespaceOnlyGuard({ candidate: leadingWhitespaceCandidate })
    ? leadingWhitespaceCandidate
    : '  ';
  const indent = `${targetLineIndent}  `;

  const lastProperty = targetObject.properties.at(-1);
  const insertPos =
    lastProperty === undefined
      ? targetObject.getStart(sourceFile) + 1
      : text[lastProperty.getEnd()] === ','
        ? lastProperty.getEnd() + 1
        : lastProperty.getEnd();
  const needsLeadingComma = lastProperty !== undefined && text[lastProperty.getEnd()] !== ',';

  if (pathsMatch === undefined) {
    return tsconfigPathsLocateResultContract.parse({
      situation: 'missingPaths',
      insertPos,
      indent,
      needsLeadingComma,
    });
  }

  const existingKeys = targetObject.properties.flatMap((property) =>
    ts.isPropertyAssignment(property) && ts.isStringLiteral(property.name)
      ? [property.name.text]
      : [],
  );

  return tsconfigPathsLocateResultContract.parse({
    situation: 'hasPaths',
    insertPos,
    indent,
    needsLeadingComma,
    existingKeys,
  });
};
