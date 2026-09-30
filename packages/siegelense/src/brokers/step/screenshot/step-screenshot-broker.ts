/**
 * PURPOSE: Drives the `screenshot` step — the one verb whose whole job IS the capture, so unlike
 * `goto`/`click`/`type` it never waits on `stepDispatchBroker`'s unasked-capture policy for its shot;
 * it takes the shot itself, and its reading is that shot's own path. Reach for this only through the
 * dispatcher, which resolves `filePath` from the run's shots directory before calling in — this
 * broker never derives a path of its own. The capture covers the viewport only, so when the page
 * extends past it the reading carries a second line saying how much (`CUT OFF — page 900px tall;
 * 400px below the viewport`); a page that fits reads as the bare path.
 *
 * USAGE:
 * await stepScreenshotBroker({ session, filePath: '/repo/.dungeonmaster-assets/siegelense-assets/.../runs/run_2/step4.png' });
 * // Captures the page to filePath and returns it as the reading, plus a cut-off line when the page continues
 */

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { scrollCutoffRenderTransformer } from '../../../transformers/scroll-cutoff-render/scroll-cutoff-render-transformer';
import { stepScrollReadBroker } from '../scroll-read/step-scroll-read-broker';

export const stepScreenshotBroker = async ({
  session,
  filePath,
}: {
  session: BrowserSession;
  filePath: string;
}): Promise<string> => {
  await session.capture({ filePath });
  const scroll = await stepScrollReadBroker({ session });
  const cutoff = scroll === null ? null : scrollCutoffRenderTransformer({ reading: scroll });
  return cutoff === null ? filePath : `${filePath}\n${cutoff}`;
};
