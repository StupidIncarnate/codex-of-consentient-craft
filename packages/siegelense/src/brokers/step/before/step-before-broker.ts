/**
 * PURPOSE: Drives the `before` step — installs an init script on the browser session via
 * `session.addInitScript({ source })`, then renders the reading into ContentText.
 *
 * USAGE:
 * await stepBeforeBroker({ session, source: 'window.__injected = true;' });
 * // Returns 'installed init script (25 chars)' as ContentText
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { beforeReadingRenderTransformer } from '../../../transformers/before-reading-render/before-reading-render-transformer';

export const stepBeforeBroker = async ({
  session,
  source,
}: {
  session: BrowserSession;
  source: string;
}): Promise<ContentText> => {
  await session.addInitScript({ source });

  return beforeReadingRenderTransformer({ source });
};
