/**
 * PURPOSE: Converts ESLint result to internal LintResult format with validation
 *
 * USAGE:
 * const lintResult = eslintResultToLintResultTransformer({ eslintResult });
 * // Returns validated LintResult with simplified structure
 */
import type { LintResult } from '../../contracts/lint-result/lint-result-contract';
import { lintMessageContract } from '../../contracts/lint-message/lint-message-contract';
import { lintResultContract } from '../../contracts/lint-result/lint-result-contract';

/**
 * Transforms an ESLint result to the internal LintResult format.
 *
 * Converts ESLint's native result structure to a simplified format
 * used throughout the hooks package.
 *
 * @param eslintResult - The ESLint result to transform
 * @returns The transformed LintResult
 */
export const eslintResultToLintResultTransformer = ({
  eslintResult,
}: {
  eslintResult: {
    filePath: string;
    messages: unknown[];
    errorCount: number;
    warningCount: number;
  };
}): LintResult => {
  // Filter and validate messages
  const validMessages = eslintResult.messages
    .filter((msg): msg is { line: unknown; column: unknown; message: unknown; severity: unknown; ruleId?: unknown } => {
      // ESLint can return messages without line/column for non-TypeScript files
      if (typeof msg !== 'object' || msg === null) return false;

      const msgObj = msg as Record<PropertyKey, unknown>;
      const line = Reflect.get(msgObj, 'line');
      const column = Reflect.get(msgObj, 'column');

      // Filter out messages with invalid line/column
      return (
        typeof line === 'number' &&
        line > 0 &&
        typeof column === 'number' &&
        column >= 0
      );
    })
    .map((msg) => {
      const msgObj = msg as Record<PropertyKey, unknown>;
      const messageData = {
        line: Reflect.get(msgObj, 'line'),
        column: Reflect.get(msgObj, 'column'),
        message: Reflect.get(msgObj, 'message'),
        severity: Reflect.get(msgObj, 'severity'),
      };

      const ruleId = Reflect.get(msgObj, 'ruleId');
      if (ruleId !== null && ruleId !== '') {
        return lintMessageContract.parse({
          ...messageData,
          ruleId,
        });
      }

      return lintMessageContract.parse(messageData);
    });

  return lintResultContract.parse({
    filePath: eslintResult.filePath,
    messages: validMessages,
    errorCount: eslintResult.errorCount,
    warningCount: eslintResult.warningCount,
  });
};
