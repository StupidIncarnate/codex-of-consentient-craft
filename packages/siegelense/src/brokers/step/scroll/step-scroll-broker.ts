/**
 * PURPOSE: Drives the `scroll` step — moves the page by running one page-side move through the
 * session's own `evaluateSource`, then reads the geometry back so the reading is the position the
 * page actually ended at, not the one asked for. The handle (`target` or `ref`) is resolved to
 * exactly one element by the layer above before this runs. Reach for `stepResizeBroker` to change
 * the viewport instead.
 *
 * USAGE:
 * await stepScrollBroker({ session, target: null, within: null, ref: null, by: 400, byX: null, to: null });
 * // Returns 'scroll position x=0 y=400; page 1280x900; viewport 1280x500; max scroll x=0 y=400'
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { scrollReadingRenderTransformer } from '../../../transformers/scroll-reading-render/scroll-reading-render-transformer';
import { scrollSourceBuildTransformer } from '../../../transformers/scroll-source-build/scroll-source-build-transformer';
import { stepScrollReadBroker } from '../scroll-read/step-scroll-read-broker';

export const stepScrollBroker = async ({
  session,
  target,
  within,
  ref,
  by,
  byX,
  to,
}: {
  session: BrowserSession;
  target: string | null;
  within: string | null;
  ref: number | null;
  by: number | null;
  byX: number | null;
  to: string | null;
}): Promise<ContentText> => {
  await session.evaluateSource({
    source: scrollSourceBuildTransformer({ target, within, ref, by, byX, to }),
  });

  const reading = await stepScrollReadBroker({ session });
  if (reading === null) {
    throw new Error(
      'step-scroll-broker: the page answered no scroll geometry after the move, so the new position is unknown',
    );
  }

  return scrollReadingRenderTransformer({ reading });
};
