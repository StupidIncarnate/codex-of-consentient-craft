/**
 * PURPOSE: Reads the page's scroll geometry through the session's own `evaluateSource`, so no
 * adapter method exists for it. `screenshot` and `look` use it to learn whether their capture
 * omitted content, and `scroll` uses it for the position it reports. An empty answer — a page with
 * no document to measure — reads as no measurement (`null`) rather than a guess.
 *
 * USAGE:
 * await stepScrollReadBroker({ session });
 * // Returns the ScrollReading, or null when the page answered nothing
 */

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { scrollReadingContract } from '../../../contracts/scroll-reading/scroll-reading-contract';
import type { ScrollReading } from '../../../contracts/scroll-reading/scroll-reading-contract';
import { scrollStatics } from '../../../statics/scroll/scroll-statics';

export const stepScrollReadBroker = async ({
  session,
}: {
  session: BrowserSession;
}): Promise<ScrollReading | null> => {
  const answered = await session.evaluateSource({ source: scrollStatics.readSource });
  if (answered === '' || answered === 'undefined' || answered === 'null') {
    return null;
  }

  const parsed: unknown = JSON.parse(answered);
  return scrollReadingContract.parse(parsed);
};
