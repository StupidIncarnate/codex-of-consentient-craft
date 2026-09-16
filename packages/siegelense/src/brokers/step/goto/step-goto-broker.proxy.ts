// PURPOSE: Builds a BrowserSession whose `goto` is a jest.fn(), and exposes its call list so a test
// can assert the exact `{url}` step-goto-broker drove it with — this package's `BrowserSession` is a
// contract-level facade (a service object, not an adapter), so its methods are plain jest.fn()s
// following step-target-resolve-broker.proxy.ts's own pattern rather than registerMock.
// USAGE: const proxy = stepGotoBrokerProxy(); const { session, getGotoCalls } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';

export const stepGotoBrokerProxy = (): {
  session: () => { session: BrowserSession; getGotoCalls: () => readonly unknown[] };
} => ({
  session: (): { session: BrowserSession; getGotoCalls: () => readonly unknown[] } => {
    const goto = jest.fn().mockResolvedValue(undefined);
    return {
      session: BrowserSessionStub({ goto }),
      getGotoCalls: (): readonly unknown[] => goto.mock.calls,
    };
  },
});
