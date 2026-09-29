// PURPOSE: Builds a BrowserSession whose `evaluateSource` answers with the text a test chose, and
// exposes its call list so a test can assert the exact source the broker sent.
// USAGE: const proxy = stepScrollReadBrokerProxy(); const { session, getEvaluateCalls } = proxy.session({ answer });

import { ContentTextStub } from '@dungeonmaster/shared/contracts';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';

type BrowserSession = ReturnType<typeof BrowserSessionStub>;

export const stepScrollReadBrokerProxy = (): {
  session: (params: { answer: string }) => {
    session: BrowserSession;
    getEvaluateCalls: () => readonly unknown[];
  };
} => ({
  session: ({
    answer,
  }: {
    answer: string;
  }): { session: BrowserSession; getEvaluateCalls: () => readonly unknown[] } => {
    const evaluateSource = jest.fn().mockResolvedValue(ContentTextStub({ value: answer }));
    return {
      session: BrowserSessionStub({ evaluateSource }),
      getEvaluateCalls: (): readonly unknown[] => evaluateSource.mock.calls,
    };
  },
});
