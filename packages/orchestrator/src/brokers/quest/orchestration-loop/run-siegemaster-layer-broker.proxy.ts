import {
  questContract,
  type ExitCode,
  type QuestStub,
  type QuestWorkItemId,
  type WorkItem,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';

import type { StreamSignal } from '../../../contracts/stream-signal/stream-signal-contract';
import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

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

const parseLastPersisted = (persisted: readonly unknown[]): Quest | undefined => {
  if (persisted.length === 0) return undefined;
  const raw = persisted[persisted.length - 1];
  const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return questContract.parse(parsed);
};

export const runSiegemasterLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupSpawnSuccess: (params: { quest: Quest; exitCode: ExitCode }) => void;
  setupSpawnWithSignal: (params: {
    quest: Quest;
    exitCode: ExitCode;
    signal: StreamSignal;
  }) => void;
  getPersistedWorkItemStatus: (params: {
    workItemId: QuestWorkItemId;
  }) => WorkItemStatus | undefined;
  getPersistedWorkItem: (params: { workItemId: QuestWorkItemId }) => WorkItem | undefined;
  getPersistedWorkItemByRole: (params: { role: WorkItem['role'] }) => WorkItem | undefined;
  getModifyContents: () => readonly unknown[];
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const spawnProxy = agentSpawnByRoleBrokerProxy();

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');
  jest.spyOn(crypto, 'randomUUID').mockReturnValue('aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee');

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
    getPersistedWorkItemStatus: ({
      workItemId,
    }: {
      workItemId: QuestWorkItemId;
    }): WorkItemStatus | undefined => {
      const quest = parseLastPersisted(modifyProxy.getAllPersistedContents());
      return quest?.workItems.find((wi) => wi.id === workItemId)?.status;
    },
    getPersistedWorkItem: ({
      workItemId,
    }: {
      workItemId: QuestWorkItemId;
    }): WorkItem | undefined => {
      const quest = parseLastPersisted(modifyProxy.getAllPersistedContents());
      return quest?.workItems.find((wi) => wi.id === workItemId);
    },
    getPersistedWorkItemByRole: ({ role }: { role: WorkItem['role'] }): WorkItem | undefined => {
      const quest = parseLastPersisted(modifyProxy.getAllPersistedContents());
      return quest?.workItems.find((wi) => wi.role === role);
    },
    getModifyContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),
  };
};
