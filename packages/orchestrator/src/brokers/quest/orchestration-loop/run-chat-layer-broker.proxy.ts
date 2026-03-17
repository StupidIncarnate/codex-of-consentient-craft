import { questContract, type QuestStub } from '@dungeonmaster/shared/contracts';

import { agentSpawnUnifiedBrokerProxy } from '../../agent/spawn-unified/agent-spawn-unified-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const runChatLayerBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupSpawnSuccess: (params: { quest: Quest; lines: readonly string[] }) => void;
  setupSpawnSuccessWithSessionId: (params: { quest: Quest; lines: readonly string[] }) => void;
  setupSpawnFailure: (params: { quest: Quest; error: Error }) => void;
  setupSpawnWithExitCode: (params: {
    quest: Quest;
    lines: readonly string[];
    exitCode: number | null;
  }) => void;
  getModifyContents: () => readonly unknown[];
} => {
  const modifyProxy = questModifyBrokerProxy();
  const spawnProxy = agentSpawnUnifiedBrokerProxy();

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnAndEmitLines({ lines: [], exitCode: 0 });
    },

    setupSpawnSuccess: ({ quest, lines }: { quest: Quest; lines: readonly string[] }): void => {
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnAndEmitLines({ lines, exitCode: 0 });
    },

    setupSpawnSuccessWithSessionId: ({
      quest,
      lines,
    }: {
      quest: Quest;
      lines: readonly string[];
    }): void => {
      // Two modify calls: sessionId write + completion write
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnAndEmitLines({ lines, exitCode: 0 });
    },

    setupSpawnFailure: ({ quest, error }: { quest: Quest; error: Error }): void => {
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnThrow({ error });
    },

    setupSpawnWithExitCode: ({
      quest,
      lines,
      exitCode,
    }: {
      quest: Quest;
      lines: readonly string[];
      exitCode: number | null;
    }): void => {
      // Non-zero exit throws, leading to one failed write
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnAndEmitLines({ lines, exitCode });
    },

    getModifyContents: (): readonly unknown[] => {
      const persisted = modifyProxy.getAllPersistedContents();
      return persisted.map((raw) => {
        const parsed = typeof raw === 'string' ? (JSON.parse(raw) as unknown) : raw;
        return questContract.parse(parsed);
      });
    },
  };
};
