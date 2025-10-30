/**
 * PURPOSE: Formats basic violation message without custom display names
 *
 * USAGE:
 * const message = violationMessageFormatTransformer({ violations });
 * // Returns multi-line formatted string with generic violation info
 */
import type { ViolationCount } from '../../contracts/violation-count/violation-count-contract';

export const violationMessageFormatTransformer = ({
  violations,
}: {
  violations: ViolationCount[];
}): string => {
  const lines = ['🛑 New code quality violations detected:'];

  for (const violation of violations) {
    const count = violation.count === 1 ? '1 violation' : `${violation.count} violations`;
    lines.push(`  ❌ Code Quality Issue: ${count}`);

    // Show line:column info for each violation
    for (const detail of violation.details) {
      lines.push(`     Line ${detail.line}:${detail.column} - ${detail.message}`);
    }
  }

  lines.push('');
  lines.push('These rules help maintain code quality and safety. Please fix the violations.');

  return lines.join('\n');
};
