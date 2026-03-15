import type { ExitCode } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questVerifyBrokerProxy } from '../verify/quest-verify-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const runPathseekerLayerBrokerProxy = (): {
  setupSuccess: (params: {
    quest: Quest;
    spawnLines: Parameters<
      ReturnType<typeof agentSpawnByRoleBrokerProxy>['setupSpawnOnce']
    >[0]['lines'];
    exitCode: ExitCode;
  }) => void;
  setupSpawnFailure: (params: { quest: Quest }) => void;
  getPersistedQuestJsons: () => readonly unknown[];
  getSpawnedArgs: () => unknown;
} => {
  const modifyProxy = questModifyBrokerProxy();
  const verifyProxy = questVerifyBrokerProxy();
  const spawnProxy = agentSpawnByRoleBrokerProxy();

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');

  return {
    setupSuccess: ({
      quest,
      spawnLines,
      exitCode,
    }: {
      quest: Quest;
      spawnLines: Parameters<
        ReturnType<typeof agentSpawnByRoleBrokerProxy>['setupSpawnOnce']
      >[0]['lines'];
      exitCode: ExitCode;
    }): void => {
      modifyProxy.setupQuestFound({ quest });
      verifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnOnce({ lines: spawnLines, exitCode });
    },

    setupSpawnFailure: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnFailureOnce();
    },

    getPersistedQuestJsons: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),
  };
};
