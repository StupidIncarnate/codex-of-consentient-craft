import {
  questContract,
  type QuestStub,
  type QuestWorkItemId,
  type WorkItemStatus,
} from '@dungeonmaster/shared/contracts';

import { agentSpawnUnifiedBrokerProxy } from '../../agent/spawn-unified/agent-spawn-unified-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const runChatLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupSpawnSuccess: (params: { quest: Quest; lines: readonly string[] }) => void;
  setupSpawnThrow: (params: { quest: Quest }) => void;
  setupSpawnNonZeroExit: (params: { quest: Quest }) => void;
  getSpawnedArgs: () => unknown;
  getAllPersistedContents: () => readonly unknown[];
  getLastPersistedWorkItemStatus: (params: {
    workItemId: QuestWorkItemId;
  }) => WorkItemStatus | undefined;
} => {
  const modifyProxy = questModifyBrokerProxy();
  const spawnProxy = agentSpawnUnifiedBrokerProxy();

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

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),

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
