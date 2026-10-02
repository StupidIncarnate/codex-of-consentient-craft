/**
 * PURPOSE: Test proxy for SiegelenseCleanupResponder — mocks `cleanupRunBroker` directly rather
 * than composing its own child proxies' staging, matching `SiegelenseStatusResponderProxy`'s shape
 * for the sibling command. `cleanupRunBrokerProxy` is still constructed (never addressed further)
 * to satisfy `enforce-proxy-child-creation`.
 *
 * USAGE:
 * const proxy = SiegelenseCleanupResponderProxy();
 * proxy.stageAnswer({ answer });
 */

import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { cleanupRunBroker } from '../../../brokers/cleanup/run/cleanup-run-broker';
import { cleanupRunBrokerProxy } from '../../../brokers/cleanup/run/cleanup-run-broker.proxy';
import type { CleanupAnswerStub } from '../../../contracts/cleanup-answer/cleanup-answer.stub';

// The directory the responder reads as where it runs; the repo root it hands down is this same path.
const CWD_VALUE = '/default/cwd';

type CleanupAnswer = ReturnType<typeof CleanupAnswerStub>;

export const SiegelenseCleanupResponderProxy = (): {
  stageAnswer: (params: { answer: CleanupAnswer }) => void;
  getStdoutWrites: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages cleanupRunBroker
  // directly below, never through its own setup methods.
  cleanupRunBrokerProxy();

  const cwdStagingProxy = cwdProxy();
  cwdStagingProxy.setupCwd({ value: CWD_VALUE });
  const resolveProxy = cwdResolveBrokerProxy();
  resolveProxy.setupRepoRootFoundAtStart({ startPath: CWD_VALUE });
  const cleanupRunHandle = registerMock({ fn: cleanupRunBroker });
  const stdout = stdoutProxy();

  return {
    stageAnswer: ({ answer }: { answer: CleanupAnswer }): void => {
      cleanupRunHandle.calledWith([{ repoRoot: CWD_VALUE }]).resolves(answer);
    },

    getStdoutWrites: (): unknown[] => [...stdout.getWrites()],
  };
};
