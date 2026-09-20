/**
 * PURPOSE: Drives the `resize` step — changes the browser session viewport via
 * `session.setViewport({ width, height })`, then renders the reading into ContentText.
 *
 * USAGE:
 * await stepResizeBroker({ session, width: 1280, height: 720 });
 * // Returns 'resized to 1280x720' as ContentText
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { resizeReadingRenderTransformer } from '../../../transformers/resize-reading-render/resize-reading-render-transformer';

export const stepResizeBroker = async ({
  session,
  width,
  height,
}: {
  session: BrowserSession;
  width: number;
  height: number;
}): Promise<ContentText> => {
  await session.setViewport({ width, height });

  return resizeReadingRenderTransformer({ width, height });
};
