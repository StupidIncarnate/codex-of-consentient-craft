import {
  questContract,
  type ExitCode,
  type QuestStub,
  type QuestWorkItemId,
  type SessionId,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';

import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { slotManagerOrchestrateBrokerProxy } from '../../slot-manager/orchestrate/slot-manager-orchestrate-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const runCodeweaverLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupSpawnAndMonitor: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupSpawnAutoLines: (params: { lines: readonly string[]; exitCode: ExitCode }) => void;
  setupModifyReject: (params: { error: Error }) => void;
  setupStderrCapture: () => void;
  getStderrWrites: () => readonly unknown[];
  getLastPersistedWorkItemStatus: (params: {
    workItemId: QuestWorkItemId;
  }) => WorkItemStatus | undefined;
  getLastPersistedWorkItemSessionId: (params: {
    workItemId: QuestWorkItemId;
  }) => SessionId | undefined;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const slotProxy = slotManagerOrchestrateBrokerProxy();
  const stderrSpy: { current: jest.SpyInstance | null } = { current: null };

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },
    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },
    setupSpawnAndMonitor: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      slotProxy.setupSpawnAndMonitor({ lines, exitCode });
    },
    setupSpawnAutoLines: ({
      lines,
      exitCode,
    }: {
      lines: readonly string[];
      exitCode: ExitCode;
    }): void => {
      slotProxy.setupSpawnAutoLines({ lines, exitCode });
    },
    getLastPersistedWorkItemStatus: ({
      workItemId,
    }: {
      workItemId: QuestWorkItemId;
    }): WorkItemStatus | undefined => {
      const persisted = modifyProxy.getAllPersistedContents();
      if (persisted.length === 0) {
        return undefined;
      }
      const raw = persisted[persisted.length - 1];
      const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
      const lastQuest = questContract.parse(parsed);
      const item = lastQuest.workItems.find((wi) => wi.id === workItemId);
      return item?.status;
    },
    setupModifyReject: ({ error }: { error: Error }): void => {
      modifyProxy.setupReject({ error });
    },

    setupStderrCapture: (): void => {
      stderrSpy.current = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
    },

    getStderrWrites: (): readonly unknown[] =>
      stderrSpy.current?.mock.calls.map((call: readonly unknown[]) => call[0]) ?? [],

    getLastPersistedWorkItemSessionId: ({
      workItemId,
    }: {
      workItemId: QuestWorkItemId;
    }): SessionId | undefined => {
      const persisted = modifyProxy.getAllPersistedContents();
      if (persisted.length === 0) {
        return undefined;
      }
      const raw = persisted[persisted.length - 1];
      const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
      const lastQuest = questContract.parse(parsed);
      const item = lastQuest.workItems.find((wi) => wi.id === workItemId);
      return item?.sessionId;
    },
  };
};
