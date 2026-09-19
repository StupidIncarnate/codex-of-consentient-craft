// PURPOSE: Builds a BrowserSession whose `boxRef` is a jest.fn() returning a BoxReading the test
// chose, and exposes its call list so a test can assert the exact `ref` the broker drove with.
// USAGE: const proxy = stepBoxBrokerProxy(); const { session, getBoxCalls } = proxy.session({ reading });

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';
import type { BoxReadingStub } from '../../../contracts/box-reading/box-reading.stub';

type BoxReading = ReturnType<typeof BoxReadingStub>;

export const stepBoxBrokerProxy = (): {
  session: (params: { reading: BoxReading }) => {
    session: BrowserSession;
    getBoxCalls: () => readonly unknown[];
  };
} => ({
  session: ({
    reading,
  }: {
    reading: BoxReading;
  }): { session: BrowserSession; getBoxCalls: () => readonly unknown[] } => {
    const boxRef = jest.fn().mockResolvedValue(reading);
    return {
      session: BrowserSessionStub({ boxRef }),
      getBoxCalls: (): readonly unknown[] => boxRef.mock.calls,
    };
  },
});
