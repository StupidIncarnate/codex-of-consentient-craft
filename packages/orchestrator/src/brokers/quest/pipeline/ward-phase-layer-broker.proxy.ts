import { AssistantToolUseStreamLineStub, type ExitCode } from '@dungeonmaster/shared/contracts';

import { slotManagerOrchestrateBrokerProxy } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker.proxy';
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
  const slotManagerProxy = slotManagerOrchestrateBrokerProxy();
  // Must be last - both capture and stream-json proxies mock child_process.spawn.
  // The last mockImplementation becomes the default for calls after all mockReturnValueOnce are consumed.
  const spawnProxy = spawnWardLayerBrokerProxy();

  const setupSpiritmendsComplete = ({
    spiritmenderExitCode,
  }: {
    spiritmenderExitCode: ExitCode;
  }): void => {
    const signalLine = JSON.stringify(
      AssistantToolUseStreamLineStub({
        message: {
          role: 'assistant',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_01EaCJyt5y8gzMNyGYarwUDZ',
              name: 'mcp__dungeonmaster__signal-back',
              input: {
                signal: 'complete',
                stepId: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
                summary: 'Fixed',
              },
            },
          ],
        },
      }),
    );
    slotManagerProxy.setupSpawnAndMonitor({
      lines: [signalLine],
      exitCode: spiritmenderExitCode,
    });
  };

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
      setupSpiritmendsComplete({ spiritmenderExitCode });
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
      setupSpiritmendsComplete({ spiritmenderExitCode });
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
      setupSpiritmendsComplete({ spiritmenderExitCode });
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
