/**
 * PURPOSE: Converts ESLint result to internal LintResult format with validation
 *
 * USAGE:
 * const lintResult = eslintResultToLintResultTransformer({ eslintResult });
 * // Returns validated LintResult with simplified structure
 */
import type { Linter } from '#gateway/npm/eslint';
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
    messages: Linter.LintMessage[];
    errorCount: number;
    warningCount: number;
  };
}): LintResult => {
  // A message with no source location (line 0) is not a violation the hooks can point at
  const validMessages = eslintResult.messages
    .filter((msg) => msg.line > 0 && msg.column >= 0)
    .map(({ line, column, message, severity, ruleId }) => {
      const messageData = { line, column, message, severity };

      if (ruleId !== null && ruleId !== '') {
        return lintMessageContract.parse({ ...messageData, ruleId });
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
