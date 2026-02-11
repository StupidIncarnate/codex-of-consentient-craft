import type { ExitCode } from '@dungeonmaster/shared/contracts';

import { agentParallelRunnerBrokerProxy } from '../../agent/parallel-runner/agent-parallel-runner-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { spawnWardLayerBrokerProxy } from './spawn-ward-layer-broker.proxy';

export const wardPhaseLayerBrokerProxy = (): {
  setupWardSuccessFirstTry: (params: { exitCode: ExitCode }) => void;
  setupWardFailThenSucceed: (params: {
    failExitCode: ExitCode;
    failOutput: string;
    successExitCode: ExitCode;
    spiritmenderExitCode: ExitCode;
  }) => void;
  setupWardFailMaxRetries: (params: {
    failExitCode: ExitCode;
    failOutput: string;
    spiritmenderExitCode: ExitCode;
  }) => void;
  setupWardFailNoPathsFallbackToQuest: (params: {
    failExitCode: ExitCode;
    failOutput: string;
    questJson: string;
    successExitCode: ExitCode;
    spiritmenderExitCode: ExitCode;
  }) => void;
  setupWardFailNoPathsNoQuest: (params: {
    failExitCode: ExitCode;
    failOutput: string;
    questJson: string;
  }) => void;
} => {
  const questProxy = questLoadBrokerProxy();
  const parallelRunnerProxy = agentParallelRunnerBrokerProxy();
  // Must be last - both capture and stream-json proxies mock child_process.spawn.
  // The last mockImplementation becomes the default for calls after all mockReturnValueOnce are consumed.
  const spawnProxy = spawnWardLayerBrokerProxy();

  return {
    setupWardSuccessFirstTry: ({ exitCode }: { exitCode: ExitCode }): void => {
      spawnProxy.setupWardSuccess({ exitCode });
    },

    setupWardFailThenSucceed: ({
      failExitCode,
      failOutput,
      successExitCode,
      spiritmenderExitCode,
    }: {
      failExitCode: ExitCode;
      failOutput: string;
      successExitCode: ExitCode;
      spiritmenderExitCode: ExitCode;
    }): void => {
      spawnProxy.setupWardFailure({ exitCode: failExitCode, output: failOutput });
      parallelRunnerProxy.setupAllSpawnsSucceed({ exitCode: spiritmenderExitCode });
      spawnProxy.setupWardSuccess({ exitCode: successExitCode });
    },

    setupWardFailMaxRetries: ({
      failExitCode,
      failOutput,
      spiritmenderExitCode,
    }: {
      failExitCode: ExitCode;
      failOutput: string;
      spiritmenderExitCode: ExitCode;
    }): void => {
      parallelRunnerProxy.setupAllSpawnsSucceed({ exitCode: spiritmenderExitCode });
      spawnProxy.setupWardFailure({ exitCode: failExitCode, output: failOutput });
      spawnProxy.setupWardFailure({ exitCode: failExitCode, output: failOutput });
      spawnProxy.setupWardFailure({ exitCode: failExitCode, output: failOutput });
    },

    setupWardFailNoPathsFallbackToQuest: ({
      failExitCode,
      failOutput,
      questJson,
      successExitCode,
      spiritmenderExitCode,
    }: {
      failExitCode: ExitCode;
      failOutput: string;
      questJson: string;
      successExitCode: ExitCode;
      spiritmenderExitCode: ExitCode;
    }): void => {
      spawnProxy.setupWardFailure({ exitCode: failExitCode, output: failOutput });
      questProxy.setupQuestFile({ questJson });
      parallelRunnerProxy.setupAllSpawnsSucceed({ exitCode: spiritmenderExitCode });
      spawnProxy.setupWardSuccess({ exitCode: successExitCode });
    },

    setupWardFailNoPathsNoQuest: ({
      failExitCode,
      failOutput,
      questJson,
    }: {
      failExitCode: ExitCode;
      failOutput: string;
      questJson: string;
    }): void => {
      spawnProxy.setupWardFailure({ exitCode: failExitCode, output: failOutput });
      questProxy.setupQuestFile({ questJson });
    },
  };
};
