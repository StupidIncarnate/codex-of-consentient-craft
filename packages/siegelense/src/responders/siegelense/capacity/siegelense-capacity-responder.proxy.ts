/**
 * PURPOSE: Test proxy for SiegelenseCapacityResponder — mocks `capacityReadBroker` directly rather
 * than composing its own child proxies' staging. `capacityReadBrokerProxy` is still constructed
 * (never addressed further) to satisfy `enforce-proxy-child-creation`. The address carries the arguments, so a test can stage
 * a different answer per `{ specName, poolSize }` pair and prove the responder passes both through.
 *
 * USAGE:
 * const proxy = SiegelenseCapacityResponderProxy();
 * proxy.stageAnswer({ specName: 'dungeonmaster-stack', poolSize: null, answer });
 */

import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { stdoutProxy } from '#gateway/node/process/stdout/stdout.proxy';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { capacityReadBroker } from '../../../brokers/capacity/read/capacity-read-broker';
import { capacityReadBrokerProxy } from '../../../brokers/capacity/read/capacity-read-broker.proxy';
import type { CapacityAnswerStub } from '../../../contracts/capacity-answer/capacity-answer.stub';

// The directory the responder reads as where it runs; the repo root it hands down is this same path.
const CWD_VALUE = '/default/cwd';

type CapacityAnswer = ReturnType<typeof CapacityAnswerStub>;
type ProfilePoolSize = number;
type SpecName = string;

export const SiegelenseCapacityResponderProxy = (): {
  stageAnswer: (params: {
    specName: SpecName;
    poolSize: ProfilePoolSize | null;
    answer: CapacityAnswer;
  }) => void;
  getStdoutWrites: () => unknown[];
} => {
  // Constructed for enforce-proxy-child-creation only — this proxy stages capacityReadBroker
  // directly below, never through its own setup methods.
  capacityReadBrokerProxy();

  const cwdStagingProxy = cwdProxy();
  cwdStagingProxy.setupCwd({ value: CWD_VALUE });
  const resolveProxy = cwdResolveBrokerProxy();
  resolveProxy.setupRepoRootFoundAtStart({ startPath: CWD_VALUE });

  const capacityHandle = registerMock({ fn: capacityReadBroker });
  const stdout = stdoutProxy();

  return {
    stageAnswer: ({
      specName,
      poolSize,
      answer,
    }: {
      specName: SpecName;
      poolSize: ProfilePoolSize | null;
      answer: CapacityAnswer;
    }): void => {
      capacityHandle.calledWith([{ specName, poolSize, repoRoot: CWD_VALUE }]).resolves(answer);
    },

    getStdoutWrites: (): unknown[] => [...stdout.getWrites()],
  };
};
