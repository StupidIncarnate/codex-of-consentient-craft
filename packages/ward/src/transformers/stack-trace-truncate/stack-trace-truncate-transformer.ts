/**
 * PURPOSE: Truncates a stack trace to a maximum number of lines with a suffix indicating remaining lines
 *
 * USAGE:
 * const truncated = stackTraceTruncateTransformer({ stackTrace: 'Error\n    at a\n    at b', maxLines: 2 });
 * // Returns TruncatedStack branded string with truncation suffix if needed
 */

import {
  truncatedStackContract,
  type TruncatedStack,
} from '../../contracts/truncated-stack/truncated-stack-contract';
import { isFrameworkStackLineGuard } from '../../guards/is-framework-stack-line/is-framework-stack-line-guard';
import { outputLimitsStatics } from '../../statics/output-limits/output-limits-statics';

export const stackTraceTruncateTransformer = ({
  stackTrace,
  maxLines,
}: {
  stackTrace: string;
  maxLines?: number;
}): TruncatedStack => {
  const limit = maxLines ?? outputLimitsStatics.stackTraceDefaultMaxLines;
  const lines = stackTrace.split('\n');
  const filtered = lines.filter((line) => !isFrameworkStackLineGuard({ line }));
  const droppedCount = lines.length - filtered.length;

  if (filtered.length <= limit) {
    const suffix =
      droppedCount > 0
        ? `\n... (${String(droppedCount)} framework lines hidden, use --verbose for full trace)`
        : '';
    return truncatedStackContract.parse(`${filtered.join('\n')}${suffix}`);
  }

  const truncated = filtered.slice(0, limit);
  const remaining = filtered.length - limit + droppedCount;

  return truncatedStackContract.parse(
    `${truncated.join('\n')}\n... (${String(remaining)} more lines, use --verbose for full trace)`,
  );
};
