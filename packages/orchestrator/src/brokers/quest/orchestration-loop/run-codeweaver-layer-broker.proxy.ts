import {
  questContract,
  type ExitCode,
  type QuestStub,
  type QuestWorkItemId,
  type SessionId,
  type WorkItem,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

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
  getLastPersistedWorkItemSummary: (params: { workItemId: QuestWorkItemId }) => WorkItem['summary'];
  getAllPersistedWorkItemStatuses: (params: {
    workItemId: QuestWorkItemId;
  }) => readonly WorkItemStatus[];
  getPersistedWorkItemSessionIdAtStatus: (params: {
    workItemId: QuestWorkItemId;
    status: WorkItemStatus;
  }) => SessionId | undefined;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const slotProxy = slotManagerOrchestrateBrokerProxy();
  const stderrSpy: { current: SpyOnHandle | null } = { current: null };

  registerSpyOn({ object: Date.prototype, method: 'toISOString' }).mockReturnValue(
    '2024-01-15T10:00:00.000Z',
  );

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
      const handle = registerSpyOn({ object: process.stderr, method: 'write' });
      handle.mockImplementation(() => true);
      stderrSpy.current = handle;
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

    getLastPersistedWorkItemSummary: ({
      workItemId,
    }: {
      workItemId: QuestWorkItemId;
    }): WorkItem['summary'] => {
      const persisted = modifyProxy.getAllPersistedContents();
      // Find the persist where the target work item has a terminal status
      // (the final result-mapping call), since fire-and-forget calls can race
      const found = [...persisted].reverse().find((raw) => {
        try {
          const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
          const quest = questContract.parse(parsed);
          const item = quest.workItems.find((wi) => wi.id === workItemId);
          return item?.status === 'complete' || item?.status === 'failed';
        } catch {
          return false;
        }
      });
      if (found === undefined) {
        return undefined;
      }
      try {
        const parsed = typeof found === 'string' ? (JSON.parse(found) as unknown) : found;
        const quest = questContract.parse(parsed);
        const item = quest.workItems.find((wi) => wi.id === workItemId);
        return item?.summary;
      } catch {
        return undefined;
      }
    },

    getAllPersistedWorkItemStatuses: ({
      workItemId,
    }: {
      workItemId: QuestWorkItemId;
    }): readonly WorkItemStatus[] =>
      modifyProxy
        .getAllPersistedContents()
        .map((raw) => {
          try {
            const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
            const quest = questContract.parse(parsed);
            const item = quest.workItems.find((wi) => wi.id === workItemId);
            return item?.status;
          } catch {
            return undefined;
          }
        })
        .filter((status): status is WorkItemStatus => status !== undefined),

    getPersistedWorkItemSessionIdAtStatus: ({
      workItemId,
      status,
    }: {
      workItemId: QuestWorkItemId;
      status: WorkItemStatus;
    }): SessionId | undefined => {
      const persisted = modifyProxy.getAllPersistedContents();
      const found = [...persisted].reverse().find((raw) => {
        try {
          const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
          const quest = questContract.parse(parsed);
          const item = quest.workItems.find((wi) => wi.id === workItemId);
          return item?.status === status;
        } catch {
          return false;
        }
      });
      if (found === undefined) {
        return undefined;
      }
      try {
        const parsed = typeof found === 'string' ? (JSON.parse(found) as unknown) : found;
        const quest = questContract.parse(parsed);
        const item = quest.workItems.find((wi) => wi.id === workItemId);
        return item?.sessionId;
      } catch {
        return undefined;
      }
    },
  };
};
