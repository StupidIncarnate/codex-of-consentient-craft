// PURPOSE: Builds a BrowserSession whose `fillMatch` is a jest.fn(), and exposes its call list so a
// test can assert the exact `{target, within?, value, timeoutMs}` step-type-broker drove it with.
// USAGE: const proxy = stepTypeBrokerProxy(); const { session, getFillMatchCalls } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';

export const stepTypeBrokerProxy = (): {
  session: () => { session: BrowserSession; getFillMatchCalls: () => readonly unknown[] };
} => ({
  session: (): { session: BrowserSession; getFillMatchCalls: () => readonly unknown[] } => {
    const fillMatch = jest.fn().mockResolvedValue(undefined);
    return {
      session: BrowserSessionStub({ fillMatch }),
      getFillMatchCalls: (): readonly unknown[] => fillMatch.mock.calls,
    };
  },
});
