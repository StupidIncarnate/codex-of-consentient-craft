// PURPOSE: Builds a BrowserSession whose `clickMatch` and `clickRef` are jest.fn()s, and exposes
// both call lists so a test can assert which handle actually drove the click and with exactly what
// arguments.
// USAGE: const proxy = stepClickBrokerProxy(); const { session, getClickMatchCalls, getClickRefCalls } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';

export const stepClickBrokerProxy = (): {
  session: () => {
    session: BrowserSession;
    getClickMatchCalls: () => readonly unknown[];
    getClickRefCalls: () => readonly unknown[];
  };
} => ({
  session: (): {
    session: BrowserSession;
    getClickMatchCalls: () => readonly unknown[];
    getClickRefCalls: () => readonly unknown[];
  } => {
    const clickMatch = jest.fn().mockResolvedValue(undefined);
    const clickRef = jest.fn().mockResolvedValue(undefined);
    return {
      session: BrowserSessionStub({ clickMatch, clickRef }),
      getClickMatchCalls: (): readonly unknown[] => clickMatch.mock.calls,
      getClickRefCalls: (): readonly unknown[] => clickRef.mock.calls,
    };
  },
});
