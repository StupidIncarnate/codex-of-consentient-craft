/**
 * PURPOSE: Reports where a tsconfig's own `compilerOptions` entries sit in the file's TEXT — the
 * spot after the last option where a new one can be spliced in, and each existing option's value
 * range — so a caller can set options without reformatting the file or losing its comments. Parses
 * through TypeScript's own JSON parser, which accepts the comments and trailing commas a tsconfig
 * may carry and `JSON.parse` refuses.
 *
 * USAGE:
 * typescriptTsconfigCompilerOptionsLocateAdapter({ text: '{\n  "compilerOptions": {\n    "module": "commonjs"\n  }\n}\n' });
 * // Returns { situation: 'hasCompilerOptions', insertPos, indent: '    ', needsLeadingComma: true, existing: [{ key: 'module', valueStart, valueEnd }] }
 */

import * as ts from 'typescript';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { tsconfigCompilerOptionsLocateResultContract } from '../../../contracts/tsconfig-compiler-options-locate-result/tsconfig-compiler-options-locate-result-contract';
import type { TsconfigCompilerOptionsLocateResult } from '../../../contracts/tsconfig-compiler-options-locate-result/tsconfig-compiler-options-locate-result-contract';
import { isWhitespaceOnlyGuard } from '../../../guards/is-whitespace-only/is-whitespace-only-guard';

export const typescriptTsconfigCompilerOptionsLocateAdapter = ({
  text,
}: {
  text: string;
}): TsconfigCompilerOptionsLocateResult => {
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
    return tsconfigCompilerOptionsLocateResultContract.parse({
      situation: 'missingCompilerOptions',
    });
  }

  const [compilerOptionsProperty, compilerOptionsObject] = compilerOptionsMatch;

  // Measured from the PROPERTY's own start (the key), never the object literal's own `{` — that
  // brace sits mid-line after the key, so measuring from it would capture `  "compilerOptions": `
  // as the "indent" and fail the whitespace-only check on every real file.
  const propertyStart = compilerOptionsProperty.getStart(sourceFile);
  const lineStart = text.lastIndexOf('\n', propertyStart) + 1;
  const leadingWhitespaceCandidate = text.slice(lineStart, propertyStart);
  const propertyIndent = isWhitespaceOnlyGuard({ candidate: leadingWhitespaceCandidate })
    ? leadingWhitespaceCandidate
    : '  ';

  const lastOption = compilerOptionsObject.properties.at(-1);
  const insertPos =
    lastOption === undefined
      ? compilerOptionsObject.getStart(sourceFile) + 1
      : text[lastOption.getEnd()] === ','
        ? lastOption.getEnd() + 1
        : lastOption.getEnd();

  const existing = compilerOptionsObject.properties.flatMap((property) =>
    ts.isPropertyAssignment(property) && ts.isStringLiteral(property.name)
      ? [
          {
            key: property.name.text,
            valueStart: property.initializer.getStart(sourceFile),
            valueEnd: property.initializer.getEnd(),
          },
        ]
      : [],
  );

  return tsconfigCompilerOptionsLocateResultContract.parse({
    situation: 'hasCompilerOptions',
    insertPos,
    indent: `${propertyIndent}  `,
    needsLeadingComma: lastOption !== undefined && text[lastOption.getEnd()] !== ',',
    existing,
  });
};
