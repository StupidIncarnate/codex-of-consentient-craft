/**
 * PURPOSE: Parses TypeScript source code to extract string and regex literals with their locations.
 * The AST walk and the LiteralOccurrence/LiteralValue contract mapping are business logic, not a
 * package wrap — the wrap itself is `#gateway/npm/typescript`, so this stays a broker.
 *
 * USAGE:
 * const literals = typescriptParseBroker({ sourceCode, filePath: '/path/to/file.ts', minLength: 3 });
 * // Returns: ReadonlyMap<LiteralValue, readonly LiteralOccurrence[]> (map of literal values to their occurrences)
 */
import * as ts from '#gateway/npm/typescript';
import type { LiteralOccurrence } from '../../../contracts/literal-occurrence/literal-occurrence-contract';
import { literalOccurrenceContract } from '../../../contracts/literal-occurrence/literal-occurrence-contract';

export const typescriptParseBroker = ({
  sourceCode,
  filePath,
  minLength = 3,
}: {
  sourceCode: string;
  filePath: string;
  minLength?: number;
}): ReadonlyMap<string, readonly LiteralOccurrence[]> => {
  const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true);

  const literalsMap = new Map<string, LiteralOccurrence[]>();
  const nodesToVisit: ts.Node[] = [sourceFile];

  // Iterative AST traversal using stack
  while (nodesToVisit.length > 0) {
    const node = nodesToVisit.pop();

    if (!node) {
      continue;
    }

    // String literals
    if (ts.isStringLiteral(node)) {
      const value = node.text;

      // Skip short strings, empty strings
      if (value.length >= minLength) {
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const occurrence = literalOccurrenceContract.parse({
          filePath,
          line: position.line + 1, // TypeScript uses 0-based lines
          column: position.character,
        });

        const key = value;
        const existing = literalsMap.get(key);
        if (existing) {
          existing.push(occurrence);
        } else {
          literalsMap.set(key, [occurrence]);
        }
      }
    }

    // Regex literals
    if (ts.isRegularExpressionLiteral(node)) {
      const value = node.text;
      const position = sourceFile.getLineAndCharacterOfPosition(node.getStart());
      const occurrence = literalOccurrenceContract.parse({
        filePath,
        line: position.line + 1,
        column: position.character,
      });

      const key = value;
      const existing = literalsMap.get(key);
      if (existing) {
        existing.push(occurrence);
      } else {
        literalsMap.set(key, [occurrence]);
      }
    }

    // Add child nodes to stack for processing
    ts.forEachChild(node, (child) => {
      nodesToVisit.push(child);
    });
  }

  return new Map(literalsMap);
};
