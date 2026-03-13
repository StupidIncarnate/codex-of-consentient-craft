import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { agentParallelRunnerBrokerProxy } from '../../agent/parallel-runner/agent-parallel-runner-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { spawnWardLayerBrokerProxy } from './spawn-ward-layer-broker.proxy';

export const runWardLayerBrokerProxy = (): {
  setupWardSuccessFirstTry: (params: { exitCode: ExitCode }) => void;
} => {
  questLoadBrokerProxy();
  agentParallelRunnerBrokerProxy();
  const spawnProxy = spawnWardLayerBrokerProxy();

  return {
    setupWardSuccessFirstTry: ({ exitCode }: { exitCode: ExitCode }): void => {
      spawnProxy.setupWardSuccess({ exitCode, wardResultJson: '{"checks":[]}' });
    },
  };
};
