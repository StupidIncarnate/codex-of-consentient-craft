import type { ExitCode, QuestStub } from '@dungeonmaster/shared/contracts';

import type { StreamSignal } from '../../../contracts/stream-signal/stream-signal-contract';
import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questWorkItemInsertBrokerProxy } from '../work-item-insert/quest-work-item-insert-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

const buildSignalLine = ({ signal }: { signal: StreamSignal }) =>
  [
    JSON.stringify({
      type: 'assistant',
      message: {
        content: [
          {
            type: 'tool_use',
            id: 'toolu_signal',
            name: 'mcp__dungeonmaster__signal-back',
            input: signal,
          },
        ],
      },
    }),
  ] as const;

export const runSiegemasterLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupSpawnSuccess: (params: { quest: Quest; exitCode: ExitCode }) => void;
  setupSpawnWithSignal: (params: {
    quest: Quest;
    exitCode: ExitCode;
    signal: StreamSignal;
  }) => void;
  getModifyContents: () => readonly unknown[];
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const spawnProxy = agentSpawnByRoleBrokerProxy();
  questWorkItemInsertBrokerProxy();

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },
    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },
    setupSpawnSuccess: ({ quest, exitCode }: { quest: Quest; exitCode: ExitCode }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnOnce({ lines: [], exitCode });
    },
    setupSpawnWithSignal: ({
      quest,
      exitCode,
      signal,
    }: {
      quest: Quest;
      exitCode: ExitCode;
      signal: StreamSignal;
    }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnOnce({
        lines: buildSignalLine({ signal }),
        exitCode,
      });
    },
    getModifyContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),
  };
};
