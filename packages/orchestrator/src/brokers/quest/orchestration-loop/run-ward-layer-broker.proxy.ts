import {
  AssistantToolUseStreamLineStub,
  ExitCodeStub,
  type ExitCode,
} from '@dungeonmaster/shared/contracts';

import { slotManagerOrchestrateBrokerProxy } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { spawnWardLayerBrokerProxy } from './spawn-ward-layer-broker.proxy';

export const runWardLayerBrokerProxy = (): {
  setupWardSuccessFirstTry: (params: { exitCode: ExitCode }) => void;
} => {
  questLoadBrokerProxy();
  const slotManagerProxy = slotManagerOrchestrateBrokerProxy();
  const spawnProxy = spawnWardLayerBrokerProxy();

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
    exitCode: ExitCodeStub({ value: 0 }),
  });

  return {
    setupWardSuccessFirstTry: ({ exitCode }: { exitCode: ExitCode }): void => {
      spawnProxy.setupWardSuccess({ exitCode, wardResultJson: '{"checks":[]}' });
    },
  };
};
