/**
 * PURPOSE: Parses TypeScript source code to extract string and regex literals with their locations.
 *
 * USAGE:
 * const literals = typescriptParseAdapter({ sourceCode, filePath: '/path/to/file.ts', minLength: 3 });
 * // Returns: ReadonlyMap<LiteralValue, readonly LiteralOccurrence[]> (map of literal values to their occurrences)
 */
import * as ts from 'typescript';
import type { SourceCode } from '../../../contracts/source-code/source-code-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { LiteralOccurrence } from '../../../contracts/literal-occurrence/literal-occurrence-contract';
import type { LiteralValue } from '../../../contracts/literal-value/literal-value-contract';
import { literalOccurrenceContract } from '../../../contracts/literal-occurrence/literal-occurrence-contract';
import { literalValueContract } from '../../../contracts/literal-value/literal-value-contract';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';

export const typescriptParseAdapter = ({
  sourceCode,
  filePath,
  minLength = 3,
}: {
  sourceCode: SourceCode;
  filePath: AbsoluteFilePath;
  minLength?: number;
}): ReadonlyMap<LiteralValue, readonly LiteralOccurrence[]> => {
  const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.Latest, true);

  const literalsMap = new Map<LiteralValue, LiteralOccurrence[]>();
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
          filePath: absoluteFilePathContract.parse(filePath),
          line: position.line + 1, // TypeScript uses 0-based lines
          column: position.character,
        });

        const key = literalValueContract.parse(value);
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
        filePath: absoluteFilePathContract.parse(filePath),
        line: position.line + 1,
        column: position.character,
      });

      const key = literalValueContract.parse(value);
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
