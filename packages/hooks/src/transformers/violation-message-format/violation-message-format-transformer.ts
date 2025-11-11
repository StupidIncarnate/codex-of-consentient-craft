/**
 * PURPOSE: Formats basic violation message without custom display names
 *
 * USAGE:
 * const message = violationMessageFormatTransformer({ violations });
 * // Returns multi-line formatted string with generic violation info
 */
import type { ViolationCount } from '../../contracts/violation-count/violation-count-contract';
import { violationComparisonMessageContract } from '../../contracts/violation-comparison-message/violation-comparison-message-contract';
import type { ViolationComparisonMessage } from '../../contracts/violation-comparison-message/violation-comparison-message-contract';
import { violationMessageStatics } from '../../statics/violation-message/violation-message-statics';

export const violationMessageFormatTransformer = ({
  violations,
}: {
  violations: ViolationCount[];
}): ViolationComparisonMessage => {
  const lines: unknown[] = [violationMessageStatics.header];

  for (const violation of violations) {
    const count = violation.count === 1 ? '1 violation' : `${violation.count} violations`;
    lines.push(`  ❌ Code Quality Issue: ${count}`);

    // Show line:column info for each violation
    for (const detail of violation.details) {
      lines.push(`     Line ${detail.line}:${detail.column} - ${detail.message}`);
    }
  }

  lines.push('');
  lines.push(violationMessageStatics.footerBasic);

  return violationComparisonMessageContract.parse(lines.join('\n'));
};
