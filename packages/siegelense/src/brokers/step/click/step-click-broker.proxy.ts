// PURPOSE: Builds a BrowserSession whose `clickMatch`, `clickRef` and `waitForSettle` are
// jest.fn()s, and exposes their call lists so a test can assert which handle actually drove the
// click, with exactly what arguments, and what the click waited on afterward.
// USAGE: const proxy = stepClickBrokerProxy(); const { session, getClickMatchCalls, getClickRefCalls, getWaitForSettleCalls } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { SettleReadingStub } from '../../../contracts/settle-reading/settle-reading.stub';

export const stepClickBrokerProxy = (): {
  session: () => {
    session: BrowserSession;
    getClickMatchCalls: () => readonly unknown[];
    getClickRefCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  };
  sessionNeverSettling: () => {
    session: BrowserSession;
    getClickMatchCalls: () => readonly unknown[];
    getClickRefCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  };
} => ({
  session: (): {
    session: BrowserSession;
    getClickMatchCalls: () => readonly unknown[];
    getClickRefCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  } => {
    const clickMatch = jest.fn().mockResolvedValue(undefined);
    const clickRef = jest.fn().mockResolvedValue(undefined);
    const waitForSettle = jest.fn().mockResolvedValue(SettleReadingStub());
    return {
      session: BrowserSessionStub({ clickMatch, clickRef, waitForSettle }),
      getClickMatchCalls: (): readonly unknown[] => clickMatch.mock.calls,
      getClickRefCalls: (): readonly unknown[] => clickRef.mock.calls,
      getWaitForSettleCalls: (): readonly unknown[] => waitForSettle.mock.calls,
    };
  },

  sessionNeverSettling: (): {
    session: BrowserSession;
    getClickMatchCalls: () => readonly unknown[];
    getClickRefCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  } => {
    const clickMatch = jest.fn().mockResolvedValue(undefined);
    const clickRef = jest.fn().mockResolvedValue(undefined);
    const waitForSettle = jest.fn().mockResolvedValue(
      SettleReadingStub({
        settled: false,
        reason: 'ceiling',
        waitedMs: 5000,
        unsettled: ['network'],
        pendingRequests: 1,
      }),
    );
    return {
      session: BrowserSessionStub({ clickMatch, clickRef, waitForSettle }),
      getClickMatchCalls: (): readonly unknown[] => clickMatch.mock.calls,
      getClickRefCalls: (): readonly unknown[] => clickRef.mock.calls,
      getWaitForSettleCalls: (): readonly unknown[] => waitForSettle.mock.calls,
    };
  },
});
