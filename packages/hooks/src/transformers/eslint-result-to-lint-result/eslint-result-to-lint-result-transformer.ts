import type { ESLint } from '../../adapters/eslint/eslint-eslint';
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
  eslintResult: ESLint.LintResult;
}): LintResult =>
  lintResultContract.parse({
    filePath: eslintResult.filePath,
    messages: eslintResult.messages.map((msg) => {
      const messageData = {
        line: msg.line,
        column: msg.column,
        message: msg.message,
        severity: msg.severity,
      };

      if (msg.ruleId !== null && msg.ruleId !== '') {
        return lintMessageContract.parse({
          ...messageData,
          ruleId: msg.ruleId,
        });
      }

      return lintMessageContract.parse(messageData);
    }),
    errorCount: eslintResult.errorCount,
    warningCount: eslintResult.warningCount,
  });
