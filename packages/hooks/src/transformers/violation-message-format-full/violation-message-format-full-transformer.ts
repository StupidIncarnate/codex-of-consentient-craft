/**
 * PURPOSE: Formats complete violation message with display names, counts, and locations
 *
 * USAGE:
 * const message = violationMessageFormatFullTransformer({ violations, config, hookData });
 * // Returns multi-line formatted string with violation details and guidance
 */
import type { ViolationCount } from '../../contracts/violation-count/violation-count-contract';
import type { PreEditLintConfig } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { violationComparisonMessageContract } from '../../contracts/violation-comparison-message/violation-comparison-message-contract';
import type { ViolationComparisonMessage } from '../../contracts/violation-comparison-message/violation-comparison-message-contract';
import { ruleDisplayConfigExtractTransformer } from '../rule-display-config-extract/rule-display-config-extract-transformer';
import { violationDisplayNameDefaultTransformer } from '../violation-display-name-default/violation-display-name-default-transformer';
import { violationMessageExtractTransformer } from '../violation-message-extract/violation-message-extract-transformer';
import { violationMessageStatics } from '../../statics/violation-message/violation-message-statics';

/**
 * Formats a complete violation message for display to the user.
 *
 * Creates a multi-line message that includes:
 * - A header indicating new violations were detected
 * - Each violation with its display name, count, and instructional message
 * - Specific line:column locations for each violation instance
 * - A footer encouraging the user to fix the violations
 *
 * @param violations - Array of violations grouped by rule
 * @param config - The pre-edit lint configuration
 * @param hookData - The hook data (passed to custom message functions)
 * @returns A formatted multi-line string ready for display
 */
export const violationMessageFormatFullTransformer = ({
  violations,
  config,
  hookData,
}: {
  violations: ViolationCount[];
  config: PreEditLintConfig;
  hookData: unknown;
}): ViolationComparisonMessage => {
  const lines: unknown[] = [violationMessageStatics.header];

  for (const violation of violations) {
    const count = violation.count === 1 ? '1 violation' : `${violation.count} violations`;

    // Get display config for this rule
    const displayConfig = ruleDisplayConfigExtractTransformer({
      config,
      ruleId: violation.ruleId,
    });

    // Use display name instead of rule ID (hide rule ID from LLM)
    const displayName =
      displayConfig.displayName ??
      violationDisplayNameDefaultTransformer({ ruleId: violation.ruleId });

    lines.push(`  ❌ ${String(displayName)}: ${count}`);

    // Get custom or default message
    const message = violationMessageExtractTransformer({
      displayConfig,
      ruleId: violation.ruleId,
      hookData,
    });

    lines.push(`     ${String(message)}`);

    // Show specific line:column locations
    for (const detail of violation.details) {
      lines.push(`     Line ${detail.line}:${detail.column} - ${detail.message}`);
    }
  }

  lines.push('');
  lines.push(violationMessageStatics.footerFull);

  return violationComparisonMessageContract.parse(lines.join('\n'));
};
