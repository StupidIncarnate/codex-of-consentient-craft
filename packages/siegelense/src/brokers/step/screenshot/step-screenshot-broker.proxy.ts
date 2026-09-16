// PURPOSE: Builds a BrowserSession whose `capture` is a jest.fn(), and exposes its call list so a
// test can assert the exact `{filePath}` step-screenshot-broker drove it with.
// USAGE: const proxy = stepScreenshotBrokerProxy(); const { session, getCaptureCalls } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';

export const stepScreenshotBrokerProxy = (): {
  session: () => { session: BrowserSession; getCaptureCalls: () => readonly unknown[] };
} => ({
  session: (): { session: BrowserSession; getCaptureCalls: () => readonly unknown[] } => {
    const capture = jest.fn().mockResolvedValue(undefined);
    return {
      session: BrowserSessionStub({ capture }),
      getCaptureCalls: (): readonly unknown[] => capture.mock.calls,
    };
  },
});
