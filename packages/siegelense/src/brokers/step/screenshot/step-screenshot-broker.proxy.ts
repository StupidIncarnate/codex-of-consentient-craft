// PURPOSE: Builds a BrowserSession whose `capture` is a jest.fn(), and exposes its call list so a
// test can assert the exact `{filePath}` step-screenshot-broker drove it with. `sessionWithScroll`
// also answers the scroll-geometry read with the reading a test chose.
// USAGE: const proxy = stepScreenshotBrokerProxy(); const { session, getCaptureCalls } = proxy.session();

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import type { ScrollReadingStub } from '../../../contracts/scroll-reading/scroll-reading.stub';
import { stepScrollReadBrokerProxy } from '../scroll-read/step-scroll-read-broker.proxy';

type ScrollReading = ReturnType<typeof ScrollReadingStub>;

export const stepScreenshotBrokerProxy = (): {
  session: () => { session: BrowserSession; getCaptureCalls: () => readonly unknown[] };
  sessionWithScroll: (params: { reading: ScrollReading }) => {
    session: BrowserSession;
    getCaptureCalls: () => readonly unknown[];
  };
} => {
  stepScrollReadBrokerProxy();

  return {
    session: (): { session: BrowserSession; getCaptureCalls: () => readonly unknown[] } => {
      const capture = jest.fn().mockResolvedValue(undefined);
      return {
        session: BrowserSessionStub({ capture }),
        getCaptureCalls: (): readonly unknown[] => capture.mock.calls,
      };
    },
    sessionWithScroll: ({
      reading,
    }: {
      reading: ScrollReading;
    }): { session: BrowserSession; getCaptureCalls: () => readonly unknown[] } => {
      const capture = jest.fn().mockResolvedValue(undefined);
      const evaluateSource = jest.fn().mockResolvedValue(JSON.stringify(reading));
      return {
        session: BrowserSessionStub({ capture, evaluateSource }),
        getCaptureCalls: (): readonly unknown[] => capture.mock.calls,
      };
    },
  };
};
