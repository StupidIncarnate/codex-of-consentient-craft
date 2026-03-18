import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { agentSpawnUnifiedBrokerProxy } from '../../agent/spawn-unified/agent-spawn-unified-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const runChatLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupSpawnSuccess: (params: { quest: Quest; lines: readonly string[] }) => void;
  setupSpawnThrow: (params: { quest: Quest }) => void;
  getSpawnedArgs: () => unknown;
  getAllPersistedContents: () => readonly unknown[];
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

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),

    getAllPersistedContents: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),
  };
};
