import {
  questContract,
  type ExitCode,
  type QuestStub,
  type QuestWorkItemId,
  type WorkItem,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

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

export const runBlightwardenLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupSpawnAborted: (params: { quest: Quest }) => void;
  setupSpawnWithSignal: (params: {
    quest: Quest;
    exitCode: ExitCode;
    signal: StreamSignal;
  }) => void;
  setupSpawnWithFailedReplan: (params: {
    quest: Quest;
    exitCode: ExitCode;
    signal: StreamSignal;
  }) => void;
  setupSpawnWithSessionAndSignal: (params: {
    quest: Quest;
    exitCode: ExitCode;
    signal: StreamSignal;
    sessionIdLine: string;
  }) => void;
  setupModifyReject: (params: { error: Error }) => void;
  setupStderrCapture: () => void;
  getStderrWrites: () => readonly unknown[];
  getPersistedWorkItemStatus: (params: {
    workItemId: QuestWorkItemId;
  }) => WorkItemStatus | undefined;
  getPersistedWorkItem: (params: { workItemId: QuestWorkItemId }) => WorkItem | undefined;
  getPersistedWorkItemByRole: (params: { role: WorkItem['role'] }) => WorkItem | undefined;
  getModifyContents: () => readonly unknown[];
  getLastPersistedBlightReports: () => readonly unknown[];
  getSpawnedArgs: () => unknown;
  spawnedPromptMatches: (params: { pattern: RegExp }) => boolean;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const spawnProxy = agentSpawnByRoleBrokerProxy();

  const toIsoHandle = registerSpyOn({ object: Date.prototype, method: 'toISOString' });
  toIsoHandle.mockReturnValue('2024-01-15T10:00:00.000Z');

  const uuidHandle = registerSpyOn({ object: crypto, method: 'randomUUID' });
  uuidHandle.mockReturnValue('aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee');

  const stderrHandle = registerSpyOn({ object: process.stderr, method: 'write' });

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },
    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },
    setupSpawnAborted: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnFailureOnce();
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
      // Only initial quest fetch is needed on complete/failed paths
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnOnce({
        lines: buildSignalLine({ signal }),
        exitCode,
      });
    },
    setupSpawnWithFailedReplan: ({
      quest,
      exitCode,
      signal,
    }: {
      quest: Quest;
      exitCode: ExitCode;
      signal: StreamSignal;
    }): void => {
      // failed-replan path fetches quest twice: initial + fresh-for-drain
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnOnce({
        lines: buildSignalLine({ signal }),
        exitCode,
      });
    },
    setupSpawnWithSessionAndSignal: ({
      quest,
      exitCode,
      signal,
      sessionIdLine,
    }: {
      quest: Quest;
      exitCode: ExitCode;
      signal: StreamSignal;
      sessionIdLine: string;
    }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnOnce({
        lines: [sessionIdLine, ...buildSignalLine({ signal })],
        exitCode,
      });
    },
    setupModifyReject: ({ error }: { error: Error }): void => {
      modifyProxy.setupReject({ error });
    },
    setupStderrCapture: (): void => {
      stderrHandle.mockImplementation(() => true);
    },
    getStderrWrites: (): readonly unknown[] =>
      stderrHandle.mock.calls.map((call: readonly unknown[]) => call[0]),
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
    getLastPersistedBlightReports: (): readonly unknown[] => {
      const quest = parseLastPersisted(modifyProxy.getAllPersistedContents());
      return quest?.planningNotes.blightReports ?? [];
    },
    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),
    spawnedPromptMatches: ({ pattern }: { pattern: RegExp }): boolean => {
      const serialized = JSON.stringify(spawnProxy.getSpawnedArgs());
      return pattern.test(serialized);
    },
  };
};
