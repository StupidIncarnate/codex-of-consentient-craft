/**
 * PURPOSE: Drives the `screenshot` step — the one verb whose whole job IS the capture, so unlike
 * `goto`/`click`/`type` it never waits on `stepDispatchBroker`'s unasked-capture policy for its shot;
 * it takes the shot itself, and its reading is that shot's own path. Reach for this only through the
 * dispatcher, which resolves `filePath` from the run's shots directory before calling in — this
 * broker never derives a path of its own.
 *
 * USAGE:
 * await stepScreenshotBroker({ session, filePath: '/repo/.siegelense/.../runs/run_2/step4.png' });
 * // Captures the page to filePath and returns it as the reading
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';

export const stepScreenshotBroker = async ({
  session,
  filePath,
}: {
  session: BrowserSession;
  filePath: string;
}): Promise<ContentText> => {
  await session.capture({ filePath });
  return contentTextContract.parse(filePath);
};
