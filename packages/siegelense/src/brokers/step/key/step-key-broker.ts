/**
 * PURPOSE: Drives the `key` step — sends a keyboard key press string to the active page via
 * `session.pressKey`, then renders what was focused after the press into a ContentText reading.
 *
 * USAGE:
 * await stepKeyBroker({ session, press: 'Enter' });
 * // Returns 'pressed "Enter" — nothing focused'
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { keyReadingRenderTransformer } from '../../../transformers/key-reading-render/key-reading-render-transformer';

export const stepKeyBroker = async ({
  session,
  press,
}: {
  session: BrowserSession;
  press: string;
}): Promise<ContentText> => {
  const reading = await session.pressKey({ press });
  return keyReadingRenderTransformer({ reading });
};
