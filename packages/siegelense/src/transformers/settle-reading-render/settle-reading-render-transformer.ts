/**
 * PURPOSE: Folds a `SettleReading` into the reading text a driving step (`click`, `type`) already
 * built for its own action. `waitForSettle` never throws on `settled: false`, so a step that ignored
 * that flag would report the action's own success and stay silent about a page still mid-update —
 * this is the one place that silence gets closed, for every driving step, without each one
 * re-deriving the wording. `settled: true` passes `baseMessage` through unchanged, since a settled
 * page is the expected outcome and repeating that on every line would bury the case worth reading.
 *
 * USAGE:
 * settleReadingRenderTransformer({
 *   baseMessage: contentTextContract.parse('clicked [data-testid="PIXEL_BTN"]'),
 *   settleReading: SettleReadingStub({ settled: true }),
 * });
 * // Returns 'clicked [data-testid="PIXEL_BTN"]'
 *
 * settleReadingRenderTransformer({
 *   baseMessage: contentTextContract.parse('clicked [data-testid="SLOW_BTN"]'),
 *   settleReading: SettleReadingStub({ settled: false, waitedMs: 5000, unsettled: ['network'] }),
 * });
 * // Returns 'clicked [data-testid="SLOW_BTN"]; did not settle after 5000ms (still moving: network)'
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { SettleReading } from '../../contracts/settle-reading/settle-reading-contract';

export const settleReadingRenderTransformer = ({
  baseMessage,
  settleReading,
}: {
  baseMessage: ContentText;
  settleReading: SettleReading;
}): ContentText => {
  if (settleReading.settled) {
    return baseMessage;
  }

  return contentTextContract.parse(
    `${baseMessage}; did not settle after ${String(settleReading.waitedMs)}ms (still moving: ${settleReading.unsettled.join(', ')})`,
  );
};
