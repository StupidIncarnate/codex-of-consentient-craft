// PURPOSE: Builds a BrowserSession whose `waitForMatch` is a jest.fn(), staged to either resolve or
// hit its ceiling (reject), and exposes its call list so a test can assert the exact
// `{target, within?, state, timeoutMs}` step-wait-for-broker drove it with.
// USAGE: const proxy = stepWaitForBrokerProxy(); const { session } = proxy.sessionResolving();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';

export const stepWaitForBrokerProxy = (): {
  sessionResolving: () => {
    session: BrowserSession;
    getWaitForMatchCalls: () => readonly unknown[];
  };
  sessionHittingCeiling: () => {
    session: BrowserSession;
    getWaitForMatchCalls: () => readonly unknown[];
  };
} => ({
  sessionResolving: (): {
    session: BrowserSession;
    getWaitForMatchCalls: () => readonly unknown[];
  } => {
    const waitForMatch = jest.fn().mockResolvedValue(undefined);
    return {
      session: BrowserSessionStub({ waitForMatch }),
      getWaitForMatchCalls: (): readonly unknown[] => waitForMatch.mock.calls,
    };
  },

  sessionHittingCeiling: (): {
    session: BrowserSession;
    getWaitForMatchCalls: () => readonly unknown[];
  } => {
    const waitForMatch = jest.fn().mockRejectedValue(new Error('Timeout 30000ms exceeded'));
    return {
      session: BrowserSessionStub({ waitForMatch }),
      getWaitForMatchCalls: (): readonly unknown[] => waitForMatch.mock.calls,
    };
  },
});
