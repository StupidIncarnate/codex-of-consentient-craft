/**
 * PURPOSE: Drives the `eval` step. `session.evaluateSource` already returns the stringified evaluated
 * value (`playwright-session-adapter.ts`'s own `evaluateSource`), so this broker exists only to give
 * `eval` the same one-file-per-verb shape as the other five rather than a bare pass-through call
 * inline in the dispatcher.
 *
 * USAGE:
 * await stepEvalSourceBroker({ session, source: '() => document.title' });
 * // Returns the stringified value the page's evaluate call produced
 */

import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';

export const stepEvalSourceBroker = async ({
  session,
  source,
}: {
  session: BrowserSession;
  source: string;
}): Promise<ContentText> => {
  const reading = await session.evaluateSource({ source });
  return reading;
};
