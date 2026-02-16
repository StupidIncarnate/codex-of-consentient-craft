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

  if (lines.length <= limit) {
    return truncatedStackContract.parse(stackTrace);
  }

  const truncated = lines.slice(0, limit);
  const remaining = lines.length - limit;

  return truncatedStackContract.parse(
    `${truncated.join('\n')}\n... (${remaining} more lines, use --verbose for full trace)`,
  );
};
