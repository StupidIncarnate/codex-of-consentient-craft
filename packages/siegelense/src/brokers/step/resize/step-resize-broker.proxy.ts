// PURPOSE: Builds a BrowserSession whose `setViewport` is a jest.fn(), and exposes its call list
// so a test can assert the exact `{width, height}` stepResizeBroker drove it with.
// USAGE: const proxy = stepResizeBrokerProxy(); const { session, getSetViewportCalls } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';

type BrowserSession = ReturnType<typeof BrowserSessionStub>;

export const stepResizeBrokerProxy = (): {
  session: () => { session: BrowserSession; getSetViewportCalls: () => readonly unknown[] };
} => ({
  session: (): { session: BrowserSession; getSetViewportCalls: () => readonly unknown[] } => {
    const setViewport = jest.fn().mockResolvedValue(undefined);

    return {
      session: BrowserSessionStub({ setViewport }),
      getSetViewportCalls: (): readonly unknown[] => setViewport.mock.calls,
    };
  },
});
