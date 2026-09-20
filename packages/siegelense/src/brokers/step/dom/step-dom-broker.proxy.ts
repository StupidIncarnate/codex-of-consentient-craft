// PURPOSE: Builds a BrowserSession whose `readDom` is a jest.fn() returning a DomReading the test
// chose, and exposes its call list so a test can assert the exact parameters the broker drove with.
// USAGE: const proxy = stepDomBrokerProxy(); const { session, getReadDomCalls } = proxy.session({ reading });

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import type { DomReadingStub } from '../../../contracts/dom-reading/dom-reading.stub';

type DomReading = ReturnType<typeof DomReadingStub>;

export const stepDomBrokerProxy = (): {
  session: (params: { reading: DomReading }) => {
    session: BrowserSession;
    getReadDomCalls: () => readonly unknown[];
  };
} => ({
  session: ({
    reading,
  }: {
    reading: DomReading;
  }): { session: BrowserSession; getReadDomCalls: () => readonly unknown[] } => {
    const readDom = jest.fn().mockResolvedValue(reading);
    return {
      session: BrowserSessionStub({ readDom }),
      getReadDomCalls: (): readonly unknown[] => readDom.mock.calls,
    };
  },
});
