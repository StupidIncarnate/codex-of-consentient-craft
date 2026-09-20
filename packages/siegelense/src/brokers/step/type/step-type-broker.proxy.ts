// PURPOSE: Builds a BrowserSession whose `fillMatch` and `fillRef` are jest.fn()s, and exposes both
// call lists so a test can assert which handle actually drove the fill and with exactly what
// arguments.
// USAGE: const proxy = stepTypeBrokerProxy(); const { session, getFillMatchCalls, getFillRefCalls } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';

export const stepTypeBrokerProxy = (): {
  session: () => {
    session: BrowserSession;
    getFillMatchCalls: () => readonly unknown[];
    getFillRefCalls: () => readonly unknown[];
  };
} => ({
  session: (): {
    session: BrowserSession;
    getFillMatchCalls: () => readonly unknown[];
    getFillRefCalls: () => readonly unknown[];
  } => {
    const fillMatch = jest.fn().mockResolvedValue(undefined);
    const fillRef = jest.fn().mockResolvedValue(undefined);
    return {
      session: BrowserSessionStub({ fillMatch, fillRef }),
      getFillMatchCalls: (): readonly unknown[] => fillMatch.mock.calls,
      getFillRefCalls: (): readonly unknown[] => fillRef.mock.calls,
    };
  },
});
