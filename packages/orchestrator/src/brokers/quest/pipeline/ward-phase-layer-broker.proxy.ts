import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { agentParallelRunnerBrokerProxy } from '../../agent/parallel-runner/agent-parallel-runner-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { spawnWardLayerBrokerProxy } from './spawn-ward-layer-broker.proxy';

export const wardPhaseLayerBrokerProxy = (): {
  setupWardSuccessFirstTry: (params: { exitCode: ExitCode }) => void;
  setupWardFailThenSucceed: (params: {
    failExitCode: ExitCode;
    failWardResultJson: string;
    successExitCode: ExitCode;
    spiritmenderExitCode: ExitCode;
  }) => void;
  setupWardFailMaxRetries: (params: {
    failExitCode: ExitCode;
    failWardResultJson: string;
    spiritmenderExitCode: ExitCode;
  }) => void;
  setupWardFailNoPathsFallbackToQuest: (params: {
    failExitCode: ExitCode;
    failWardResultJson: string;
    questJson: string;
    successExitCode: ExitCode;
    spiritmenderExitCode: ExitCode;
  }) => void;
  setupWardFailNoPathsNoQuest: (params: { failExitCode: ExitCode; questJson: string }) => void;
} => {
  const questProxy = questLoadBrokerProxy();
  const parallelRunnerProxy = agentParallelRunnerBrokerProxy();
  // Must be last - both capture and stream-json proxies mock child_process.spawn.
  // The last mockImplementation becomes the default for calls after all mockReturnValueOnce are consumed.
  const spawnProxy = spawnWardLayerBrokerProxy();

  return {
    setupWardSuccessFirstTry: ({ exitCode }: { exitCode: ExitCode }): void => {
      spawnProxy.setupWardSuccess({ exitCode, wardResultJson: '{"checks":[]}' });
    },

    setupWardFailThenSucceed: ({
      failExitCode,
      failWardResultJson,
      successExitCode,
      spiritmenderExitCode,
    }: {
      failExitCode: ExitCode;
      failWardResultJson: string;
      successExitCode: ExitCode;
      spiritmenderExitCode: ExitCode;
    }): void => {
      spawnProxy.setupWardFailure({ exitCode: failExitCode, wardResultJson: failWardResultJson });
      parallelRunnerProxy.setupAllSpawnsSucceed({ exitCode: spiritmenderExitCode });
      spawnProxy.setupWardSuccess({ exitCode: successExitCode, wardResultJson: '{"checks":[]}' });
    },

    setupWardFailMaxRetries: ({
      failExitCode,
      failWardResultJson,
      spiritmenderExitCode,
    }: {
      failExitCode: ExitCode;
      failWardResultJson: string;
      spiritmenderExitCode: ExitCode;
    }): void => {
      parallelRunnerProxy.setupAllSpawnsSucceed({ exitCode: spiritmenderExitCode });
      spawnProxy.setupWardFailure({ exitCode: failExitCode, wardResultJson: failWardResultJson });
      spawnProxy.setupWardFailure({ exitCode: failExitCode, wardResultJson: failWardResultJson });
      spawnProxy.setupWardFailure({ exitCode: failExitCode, wardResultJson: failWardResultJson });
    },

    setupWardFailNoPathsFallbackToQuest: ({
      failExitCode,
      failWardResultJson,
      questJson,
      successExitCode,
      spiritmenderExitCode,
    }: {
      failExitCode: ExitCode;
      failWardResultJson: string;
      questJson: string;
      successExitCode: ExitCode;
      spiritmenderExitCode: ExitCode;
    }): void => {
      spawnProxy.setupWardFailure({ exitCode: failExitCode, wardResultJson: failWardResultJson });
      questProxy.setupQuestFile({ questJson });
      parallelRunnerProxy.setupAllSpawnsSucceed({ exitCode: spiritmenderExitCode });
      spawnProxy.setupWardSuccess({ exitCode: successExitCode, wardResultJson: '{"checks":[]}' });
    },

    setupWardFailNoPathsNoQuest: ({
      failExitCode,
      questJson,
    }: {
      failExitCode: ExitCode;
      questJson: string;
    }): void => {
      spawnProxy.setupWardNoRunId({ exitCode: failExitCode });
      questProxy.setupQuestFile({ questJson });
    },
  };
};
