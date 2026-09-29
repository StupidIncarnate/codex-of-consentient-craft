/**
 * PURPOSE: Test proxy for SiegelensePruneResponder — mocks `pruneRunBroker` directly rather than
 * composing its own child proxies' staging, matching `SiegelenseCleanupResponderProxy`'s shape for
 * the sibling command. Nothing here reaches disk, which is the point: what this responder decides
 * is which of two renderers it hands the answer to, and a real prune would drag the whole citation
 * resolver into a question about rendering. `pruneRunBrokerProxy` is still constructed (never
 * addressed further) to satisfy `enforce-proxy-child-creation`. `getStderrWrites` exists alongside
 * `getStdoutWrites` because the dry-run notice moves streams with `isJson` (DEF-49) —
 * `getPruneRunCalls` reads back the whole argument object each `pruneRunBroker` call actually
 * carried, so a test can prove `confirm` threads through to a real `dryRun` value rather than
 * merely that a call happened.
 *
 * USAGE:
 * const proxy = SiegelensePruneResponderProxy();
 * proxy.stageAnswer({ answer: PruneAnswerStub() });
 */

import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { stderrProxy } from '#gateway/node/process/stderr/stderr.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { pruneRunBroker } from '../../../brokers/prune/run/prune-run-broker';
import { pruneRunBrokerProxy } from '../../../brokers/prune/run/prune-run-broker.proxy';
import type { PruneAnswerStub } from '../../../contracts/prune-answer/prune-answer.stub';

type PruneAnswer = ReturnType<typeof PruneAnswerStub>;

export const SiegelensePruneResponderProxy = (): {
  stageAnswer: (params: { answer: PruneAnswer }) => void;
  getStdoutWrites: () => unknown[];
  getStderrWrites: () => unknown[];
  getPruneRunCalls: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages pruneRunBroker
  // directly below, never through its own setup methods.
  pruneRunBrokerProxy();

  const pruneRunHandle = registerMock({ fn: pruneRunBroker });
  const stdout = stdoutProxy();
  const stderr = stderrProxy();

  return {
    stageAnswer: ({ answer }: { answer: PruneAnswer }): void => {
      pruneRunHandle.calledWith([]).resolves(answer);
    },

    getStdoutWrites: (): unknown[] => [...stdout.getWrites()],
    getStderrWrites: (): unknown[] => [...stderr.getWrites()],
    getPruneRunCalls: (): unknown[] => pruneRunHandle.callsMatching([]).map((call) => call[0]),
  };
};
