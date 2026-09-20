/**
 * PURPOSE: Test proxy for SiegelensePruneResponder — mocks `pruneRunBroker` directly rather than
 * composing its own child proxies' staging, matching `SiegelenseCleanupResponderProxy`'s shape for
 * the sibling command. Nothing here reaches disk, which is the point: what this responder decides
 * is which of two renderers it hands the answer to, and a real prune would drag the whole citation
 * resolver into a question about rendering. `pruneRunBrokerProxy` is still constructed (never
 * addressed further) to satisfy `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = SiegelensePruneResponderProxy();
 * proxy.stageAnswer({ answer: PruneAnswerStub() });
 */

import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { pruneRunBroker } from '../../../brokers/prune/run/prune-run-broker';
import { pruneRunBrokerProxy } from '../../../brokers/prune/run/prune-run-broker.proxy';
import type { PruneAnswerStub } from '../../../contracts/prune-answer/prune-answer.stub';

type PruneAnswer = ReturnType<typeof PruneAnswerStub>;

export const SiegelensePruneResponderProxy = (): {
  stageAnswer: (params: { answer: PruneAnswer }) => void;
  getStdoutWrites: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages pruneRunBroker
  // directly below, never through its own setup methods.
  pruneRunBrokerProxy();

  const pruneRunHandle = registerMock({ fn: pruneRunBroker });
  const stdoutHandle = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutHandle.calledWith([]).returns(true);

  return {
    stageAnswer: ({ answer }: { answer: PruneAnswer }): void => {
      pruneRunHandle.calledWith([]).resolves(answer);
    },

    getStdoutWrites: (): unknown[] => stdoutHandle.callsMatching([]).map((call) => call[0]),
  };
};
