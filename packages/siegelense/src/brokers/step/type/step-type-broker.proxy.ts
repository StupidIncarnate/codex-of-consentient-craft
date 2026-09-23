// PURPOSE: Builds a BrowserSession whose `fillMatch`, `fillRef` and `waitForSettle` are
// jest.fn()s, and exposes their call lists so a test can assert which handle actually drove the
// fill, with exactly what arguments, and what the fill waited on afterward.
// USAGE: const proxy = stepTypeBrokerProxy(); const { session, getFillMatchCalls, getFillRefCalls, getWaitForSettleCalls } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { SettleReadingStub } from '../../../contracts/settle-reading/settle-reading.stub';

export const stepTypeBrokerProxy = (): {
  session: () => {
    session: BrowserSession;
    getFillMatchCalls: () => readonly unknown[];
    getFillRefCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  };
  sessionNeverSettling: () => {
    session: BrowserSession;
    getFillMatchCalls: () => readonly unknown[];
    getFillRefCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  };
} => ({
  session: (): {
    session: BrowserSession;
    getFillMatchCalls: () => readonly unknown[];
    getFillRefCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  } => {
    const fillMatch = jest.fn().mockResolvedValue(undefined);
    const fillRef = jest.fn().mockResolvedValue(undefined);
    const waitForSettle = jest.fn().mockResolvedValue(SettleReadingStub());
    return {
      session: BrowserSessionStub({ fillMatch, fillRef, waitForSettle }),
      getFillMatchCalls: (): readonly unknown[] => fillMatch.mock.calls,
      getFillRefCalls: (): readonly unknown[] => fillRef.mock.calls,
      getWaitForSettleCalls: (): readonly unknown[] => waitForSettle.mock.calls,
    };
  },

  sessionNeverSettling: (): {
    session: BrowserSession;
    getFillMatchCalls: () => readonly unknown[];
    getFillRefCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  } => {
    const fillMatch = jest.fn().mockResolvedValue(undefined);
    const fillRef = jest.fn().mockResolvedValue(undefined);
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
      session: BrowserSessionStub({ fillMatch, fillRef, waitForSettle }),
      getFillMatchCalls: (): readonly unknown[] => fillMatch.mock.calls,
      getFillRefCalls: (): readonly unknown[] => fillRef.mock.calls,
      getWaitForSettleCalls: (): readonly unknown[] => waitForSettle.mock.calls,
    };
  },
});
