/**
 * PURPOSE: Says, in one line, which part of the page a viewport capture leaves out — or answers
 * `null` when the capture holds the whole page. `screenshot` and `look` append it so an agent
 * reading a picture learns the page continues past its edge instead of trusting a frame that ends
 * mid-form. Reach for `scrollReadingRenderTransformer` for the `scroll` step's own position reading.
 *
 * USAGE:
 * scrollCutoffRenderTransformer({ reading: ScrollReadingStub({ scrollHeight: 900, viewportHeight: 500 }) });
 * // Returns 'CUT OFF — page 900px tall; 400px below the viewport'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { ScrollReading } from '../../contracts/scroll-reading/scroll-reading-contract';
import { scrollStatics } from '../../statics/scroll/scroll-statics';

export const scrollCutoffRenderTransformer = ({
  reading,
}: {
  reading: ScrollReading;
}): ContentText | null => {
  const { cutoff } = scrollStatics;
  const above = reading.scrollY;
  const below = Math.max(0, reading.scrollHeight - reading.scrollY - reading.viewportHeight);
  const left = reading.scrollX;
  const right = Math.max(0, reading.scrollWidth - reading.scrollX - reading.viewportWidth);

  const vertical =
    above > 0 || below > 0
      ? [
          cutoff.tall.replace('{size}', String(reading.scrollHeight)),
          ...(above > 0 ? [cutoff.above.replace('{amount}', String(above))] : []),
          ...(below > 0 ? [cutoff.below.replace('{amount}', String(below))] : []),
        ]
      : [];
  const horizontal =
    left > 0 || right > 0
      ? [
          cutoff.wide.replace('{size}', String(reading.scrollWidth)),
          ...(left > 0 ? [cutoff.left.replace('{amount}', String(left))] : []),
          ...(right > 0 ? [cutoff.right.replace('{amount}', String(right))] : []),
        ]
      : [];

  const parts = [...vertical, ...horizontal];
  if (parts.length === 0) {
    return null;
  }

  return contentTextContract.parse(`${cutoff.prefix}${parts.join(cutoff.separator)}`);
};
