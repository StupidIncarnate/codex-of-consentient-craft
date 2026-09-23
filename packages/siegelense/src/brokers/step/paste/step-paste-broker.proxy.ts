// PURPOSE: Builds a BrowserSession whose `pasteMatch`, `pasteRef` and `waitForSettle` are
// jest.fn()s, and exposes their call lists so a test can assert which handle actually drove the
// paste, with exactly what arguments, and what the paste waited on afterward.
// USAGE: const proxy = stepPasteBrokerProxy(); const { session, getPasteMatchCalls, getPasteRefCalls, getWaitForSettleCalls } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import { SettleReadingStub } from '../../../contracts/settle-reading/settle-reading.stub';

export const stepPasteBrokerProxy = (): {
  session: () => {
    session: BrowserSession;
    getPasteMatchCalls: () => readonly unknown[];
    getPasteRefCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  };
  sessionNeverSettling: () => {
    session: BrowserSession;
    getPasteMatchCalls: () => readonly unknown[];
    getPasteRefCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  };
} => ({
  session: (): {
    session: BrowserSession;
    getPasteMatchCalls: () => readonly unknown[];
    getPasteRefCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  } => {
    const pasteMatch = jest.fn().mockResolvedValue(undefined);
    const pasteRef = jest.fn().mockResolvedValue(undefined);
    const waitForSettle = jest.fn().mockResolvedValue(SettleReadingStub());
    return {
      session: BrowserSessionStub({ pasteMatch, pasteRef, waitForSettle }),
      getPasteMatchCalls: (): readonly unknown[] => pasteMatch.mock.calls,
      getPasteRefCalls: (): readonly unknown[] => pasteRef.mock.calls,
      getWaitForSettleCalls: (): readonly unknown[] => waitForSettle.mock.calls,
    };
  },

  sessionNeverSettling: (): {
    session: BrowserSession;
    getPasteMatchCalls: () => readonly unknown[];
    getPasteRefCalls: () => readonly unknown[];
    getWaitForSettleCalls: () => readonly unknown[];
  } => {
    const pasteMatch = jest.fn().mockResolvedValue(undefined);
    const pasteRef = jest.fn().mockResolvedValue(undefined);
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
      session: BrowserSessionStub({ pasteMatch, pasteRef, waitForSettle }),
      getPasteMatchCalls: (): readonly unknown[] => pasteMatch.mock.calls,
      getPasteRefCalls: (): readonly unknown[] => pasteRef.mock.calls,
      getWaitForSettleCalls: (): readonly unknown[] => waitForSettle.mock.calls,
    };
  },
});
