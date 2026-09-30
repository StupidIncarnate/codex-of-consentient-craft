/**
 * PURPOSE: Formats a context token count into a human-readable label like "29.4k" or "150"
 *
 * USAGE:
 * formatContextTokensTransformer({count: contextTokenCountContract.parse(29448)});
 * // Returns '29.4k' as FormattedTokenLabel
 */

import { tokenFormatConfigStatics } from '../../statics/token-format-config/token-format-config-statics';

export const formatContextTokensTransformer = ({ count }: { count: number }): string => {
  const raw = count >= tokenFormatConfigStatics.abbreviationThreshold;

  if (raw) {
    const abbreviated = count / tokenFormatConfigStatics.abbreviationDivisor;

    return `${abbreviated.toFixed(1)}k`;
  }

  return String(count);
};
