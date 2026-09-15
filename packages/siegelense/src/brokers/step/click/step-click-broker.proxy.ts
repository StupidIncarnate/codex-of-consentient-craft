// PURPOSE: Builds a BrowserSession whose `clickMatch` is a jest.fn(), and exposes its call list so a
// test can assert the exact `{target, within?, timeoutMs}` step-click-broker drove it with.
// USAGE: const proxy = stepClickBrokerProxy(); const { session, getClickMatchCalls } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';

export const stepClickBrokerProxy = (): {
  session: () => { session: BrowserSession; getClickMatchCalls: () => readonly unknown[] };
} => ({
  session: (): { session: BrowserSession; getClickMatchCalls: () => readonly unknown[] } => {
    const clickMatch = jest.fn().mockResolvedValue(undefined);
    return {
      session: BrowserSessionStub({ clickMatch }),
      getClickMatchCalls: (): readonly unknown[] => clickMatch.mock.calls,
    };
  },
});
