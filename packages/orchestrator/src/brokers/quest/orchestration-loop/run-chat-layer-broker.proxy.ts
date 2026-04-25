import {
  questContract,
  RepoRootCwdStub,
  type QuestStub,
  type QuestWorkItemId,
  type RepoRootCwd,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import {
  claudeLineNormalizeBrokerProxy,
  cwdResolveBrokerProxy,
} from '@dungeonmaster/shared/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { agentSpawnUnifiedBrokerProxy } from '../../agent/spawn-unified/agent-spawn-unified-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const runChatLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupSpawnSuccess: (params: { quest: Quest; lines: readonly string[] }) => void;
  setupSpawnThrow: (params: { quest: Quest }) => void;
  setupSpawnNonZeroExit: (params: { quest: Quest }) => void;
  setupCwdResolveSuccess: (params: { repoRoot: ReturnType<typeof RepoRootCwdStub> }) => void;
  setupCwdResolveReject: (params: { error: Error }) => void;
  getSpawnedArgs: () => unknown;
  getSpawnedOptions: () => unknown;
  getSpawnedCwd: () => RepoRootCwd | undefined;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedWorkItemStatus: (params: {
    workItemId: QuestWorkItemId;
  }) => WorkItemStatus | undefined;
} => {
  claudeLineNormalizeBrokerProxy();
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces the broker
  // entirely so cwdResolveBrokerProxy's underlying fs/path mocks aren't actually exercised.
  cwdResolveBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const spawnProxy = agentSpawnUnifiedBrokerProxy();

  // run-chat-layer-broker walks up from startPath to repo root via cwdResolveBroker.
  // Stub it directly so tests don't need to seed fs.access expectations for the walk-up.
  const cwdResolveMock = registerMock({ fn: cwdResolveBroker });
  cwdResolveMock.mockResolvedValue(RepoRootCwdStub({ value: '/project' }));

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnAndEmitLines({ lines: [], exitCode: 0 });
    },

    setupSpawnSuccess: ({ quest, lines }: { quest: Quest; lines: readonly string[] }): void => {
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnAndEmitLines({ lines, exitCode: 0 });
    },

    setupSpawnThrow: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnThrow({ error: new Error('spawn claude ENOENT') });
    },

    setupSpawnNonZeroExit: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnAndEmitLines({ lines: [], exitCode: 1 });
    },

    setupCwdResolveSuccess: ({
      repoRoot,
    }: {
      repoRoot: ReturnType<typeof RepoRootCwdStub>;
    }): void => {
      cwdResolveMock.mockResolvedValueOnce(repoRoot);
    },

    setupCwdResolveReject: ({ error }: { error: Error }): void => {
      cwdResolveMock.mockRejectedValueOnce(error);
    },

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),

    getSpawnedOptions: (): unknown => spawnProxy.getSpawnedOptions(),

    getSpawnedCwd: (): RepoRootCwd | undefined => spawnProxy.getSpawnedCwd(),

    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),

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
  };
};
