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
import { eslintRawMessageContract } from '../../contracts/eslint-raw-message/eslint-raw-message-contract';

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
    .map((msg) => eslintRawMessageContract.safeParse(msg))
    .filter(
      (
        parsed,
      ): parsed is ReturnType<typeof eslintRawMessageContract.safeParse> & { success: true } =>
        parsed.success && parsed.data.line > 0 && parsed.data.column >= 0,
    )
    .map((parsed) => {
      const { line, column, message, severity, ruleId } = parsed.data;
      const messageData = { line, column, message, severity };

      if (ruleId !== null && ruleId !== undefined && ruleId !== '') {
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
