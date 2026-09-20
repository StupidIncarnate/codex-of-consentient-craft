/**
 * PURPOSE: Drives the `box` step — Rung 3 of the reading ladder (siegelense-tooling.md line 634:
 * `look` → `look { within }` → `box` → `dom` → `eval`). Reads one element's exact bounding geometry
 * and viewport visibility by ref, and renders the BoxReading as ContentText JSON so a session
 * reading results sees the element's exact layout.
 *
 * `runVerbLayerBroker` runs `stepTargetResolveBroker` first to confirm the ref is live in the page
 * before this broker is called, so this broker never re-checks anything itself.
 *
 * USAGE:
 * await stepBoxBroker({ session, ref: 26 });
 * // Reads the geometry of ref 26 from the session and renders it
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { boxReadingRenderTransformer } from '../../../transformers/box-reading-render/box-reading-render-transformer';

export const stepBoxBroker = async ({
  session,
  ref,
}: {
  session: BrowserSession;
  ref: number;
}): Promise<ContentText> => {
  const reading = await session.boxRef({ ref });
  return boxReadingRenderTransformer({ reading });
};
