// PURPOSE: Builds a BrowserSession whose `evaluateSource` answers the move with `true` and the
// geometry read with the reading a test chose, and exposes the sources it was driven with.
// USAGE: const proxy = stepScrollBrokerProxy(); const { session, getEvaluateCalls } = proxy.session({ reading });

import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { ScrollReadingStub } from '../../../contracts/scroll-reading/scroll-reading.stub';
import { scrollStatics } from '../../../statics/scroll/scroll-statics';
import { stepScrollReadBrokerProxy } from '../scroll-read/step-scroll-read-broker.proxy';

type BrowserSession = ReturnType<typeof BrowserSessionStub>;
type ScrollReading = ReturnType<typeof ScrollReadingStub>;

export const stepScrollBrokerProxy = (): {
  session: (params: { reading: ScrollReading | null }) => {
    session: BrowserSession;
    getEvaluateCalls: () => readonly unknown[];
  };
} => {
  stepScrollReadBrokerProxy();

  return {
    session: ({
      reading,
    }: {
      reading: ScrollReading | null;
    }): { session: BrowserSession; getEvaluateCalls: () => readonly unknown[] } => {
      const evaluateSource = jest.fn().mockImplementation(async ({ source }: { source: string }) =>
        Promise.resolve(
          ContentTextStub({
            value:
              source === scrollStatics.readSource
                ? reading === null
                  ? 'null'
                  : JSON.stringify(reading)
                : 'true',
          }),
        ),
      );
      return {
        session: BrowserSessionStub({ evaluateSource }),
        getEvaluateCalls: (): readonly unknown[] => evaluateSource.mock.calls,
      };
    },
  };
};
