/**
 * PURPOSE: Drives the `goto` step — the one member of `stepContract` that carries no `target`, so it
 * never touches `stepTargetResolveBroker`. The reading is the path itself: `session.goto` returns
 * `void` (browser-session-contract.ts has no page-url getter), so the path this step was told to
 * navigate to is the only value there is to report.
 *
 * USAGE:
 * await stepGotoBroker({ session, path: '/guilds' });
 * // Returns ContentText '/guilds' once the page has navigated there
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';

import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';

export const stepGotoBroker = async ({
  session,
  path,
}: {
  session: BrowserSession;
  path: string;
}): Promise<ContentText> => {
  await session.goto({ url: path });
  return contentTextContract.parse(path);
};
