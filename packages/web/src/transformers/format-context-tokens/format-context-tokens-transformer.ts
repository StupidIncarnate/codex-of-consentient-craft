/**
 * PURPOSE: Formats a context token count into a human-readable label like "29.4k" or "150"
 *
 * USAGE:
 * formatContextTokensTransformer({count: contextTokenCountContract.parse(29448)});
 * // Returns '29.4k' as FormattedTokenLabel
 */

import { formattedTokenLabelContract } from '../../contracts/formatted-token-label/formatted-token-label-contract';
import type { FormattedTokenLabel } from '../../contracts/formatted-token-label/formatted-token-label-contract';
import { tokenFormatConfigStatics } from '../../statics/token-format-config/token-format-config-statics';

export const formatContextTokensTransformer = ({
  count,
}: {
  count: number;
}): FormattedTokenLabel => {
  const raw =
    count >= tokenFormatConfigStatics.abbreviationThreshold;

  if (raw) {
    const abbreviated =
      count / tokenFormatConfigStatics.abbreviationDivisor;

    return formattedTokenLabelContract.parse(`${abbreviated.toFixed(1)}k`);
  }

  return formattedTokenLabelContract.parse(String(count));
};
