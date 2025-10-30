/**
 * PURPOSE: Formats complete violation message with display names, counts, and locations
 *
 * USAGE:
 * const message = violationMessageFormatFullTransformer({ violations, config, hookData });
 * // Returns multi-line formatted string with violation details and guidance
 */
import type { ViolationCount } from '../../contracts/violation-count/violation-count-contract';
import type { PreEditLintConfig } from '../../contracts/pre-edit-lint-config/pre-edit-lint-config-contract';
import { ruleDisplayConfigExtractTransformer } from '../rule-display-config-extract/rule-display-config-extract-transformer';
import { violationDisplayNameDefaultTransformer } from '../violation-display-name-default/violation-display-name-default-transformer';
import { violationRuleMessageDefaultTransformer } from '../violation-rule-message-default/violation-rule-message-default-transformer';

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
}): string => {
  const lines = ['🛑 New code quality violations detected:'];

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

    lines.push(`  ❌ ${displayName}: ${count}`);

    // Get custom or default message
    const getMessage = (): string => {
      const configMessage = displayConfig.message;

      if (configMessage === undefined) {
        return violationRuleMessageDefaultTransformer({ ruleId: violation.ruleId });
      }

      if (typeof configMessage === 'string') {
        return configMessage;
      }

      // If it's a function, call it
      try {
        const result = configMessage(hookData);
        return typeof result === 'string' ? result : String(result);
      } catch (error: unknown) {
        return `Custom message function failed: ${error instanceof Error ? error.message : String(error)}`;
      }
    };
    const message = getMessage();

    lines.push(`     ${message}`);

    // Show specific line:column locations
    for (const detail of violation.details) {
      lines.push(`     Line ${detail.line}:${detail.column} - ${detail.message}`);
    }
  }

  lines.push('');
  lines.push(
    'These rules help maintain code quality and safety. The write/edit/multi edit operation has been blocked for this change. Please submit the correct change after understanding what changes need to be made',
  );

  return lines.join('\n');
};
