// PURPOSE: Builds a BrowserSession whose `evaluateSource` is a jest.fn(), and exposes its call list
// so a test can assert the exact `{source}` step-eval-source-broker drove it with, and stage the
// value it resolves to.
// USAGE: const proxy = stepEvalSourceBrokerProxy(); const { session } = proxy.sessionEvaluating({evaluated: '"ok"'});

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { BrowserSessionStub } from '../../../contracts/browser-session/browser-session.stub';
import type { BrowserSession } from '../../../contracts/browser-session/browser-session-contract';

export const stepEvalSourceBrokerProxy = (): {
  sessionEvaluating: (params: { evaluated: string }) => {
    session: BrowserSession;
    getEvaluateSourceCalls: () => readonly unknown[];
  };
} => ({
  sessionEvaluating: ({
    evaluated,
  }: {
    evaluated: string;
  }): { session: BrowserSession; getEvaluateSourceCalls: () => readonly unknown[] } => {
    const evaluateSource = jest.fn().mockResolvedValue(contentTextContract.parse(evaluated));
    return {
      session: BrowserSessionStub({ evaluateSource }),
      getEvaluateSourceCalls: (): readonly unknown[] => evaluateSource.mock.calls,
    };
  },
});
