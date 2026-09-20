// PURPOSE: Builds a BrowserSession whose `pasteMatch` and `pasteRef` are jest.fn()s, and exposes
// both call lists so a test can assert which handle actually drove the paste and with exactly what
// arguments.
// USAGE: const proxy = stepPasteBrokerProxy(); const { session, getPasteMatchCalls, getPasteRefCalls } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';

export const stepPasteBrokerProxy = (): {
  session: () => {
    session: BrowserSession;
    getPasteMatchCalls: () => readonly unknown[];
    getPasteRefCalls: () => readonly unknown[];
  };
} => ({
  session: (): {
    session: BrowserSession;
    getPasteMatchCalls: () => readonly unknown[];
    getPasteRefCalls: () => readonly unknown[];
  } => {
    const pasteMatch = jest.fn().mockResolvedValue(undefined);
    const pasteRef = jest.fn().mockResolvedValue(undefined);
    return {
      session: BrowserSessionStub({ pasteMatch, pasteRef }),
      getPasteMatchCalls: (): readonly unknown[] => pasteMatch.mock.calls,
      getPasteRefCalls: (): readonly unknown[] => pasteRef.mock.calls,
    };
  },
});
