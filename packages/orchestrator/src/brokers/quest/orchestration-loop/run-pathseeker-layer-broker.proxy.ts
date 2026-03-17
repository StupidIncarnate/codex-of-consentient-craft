import type { ExitCode } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { questContract } from '@dungeonmaster/shared/contracts';

import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
import { questVerifyBrokerProxy } from '../verify/quest-verify-broker.proxy';
import { questWorkItemInsertBrokerProxy } from '../work-item-insert/quest-work-item-insert-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const runPathseekerLayerBrokerProxy = (): {
  setupSuccess: (params: {
    quest: Quest;
    spawnLines: Parameters<
      ReturnType<typeof agentSpawnByRoleBrokerProxy>['setupSpawnOnce']
    >[0]['lines'];
    exitCode: ExitCode;
  }) => void;
  setupVerifyPass: (params: {
    quest: Quest;
    spawnLines: Parameters<
      ReturnType<typeof agentSpawnByRoleBrokerProxy>['setupSpawnOnce']
    >[0]['lines'];
    exitCode: ExitCode;
  }) => void;
  setupSpawnFailure: (params: { quest: Quest }) => void;
  setupSpawnSuccessVerifyFail: (params: {
    quest: Quest;
    spawnLines: Parameters<
      ReturnType<typeof agentSpawnByRoleBrokerProxy>['setupSpawnOnce']
    >[0]['lines'];
    exitCode: ExitCode;
  }) => void;
  setupSpawnCrashVerifyFail: (params: { quest: Quest }) => void;
  setupSecondGetFailure: (params: {
    quest: Quest;
    spawnLines: Parameters<
      ReturnType<typeof agentSpawnByRoleBrokerProxy>['setupSpawnOnce']
    >[0]['lines'];
    exitCode: ExitCode;
  }) => void;
  setupDeterministicUuids: (params: { uuids: readonly string[] }) => void;
  getPersistedQuestJsons: () => readonly unknown[];
  getSpawnedArgs: () => unknown;
  getLastPersistedQuest: () => ReturnType<typeof questContract.parse>;
  getAllPersistedQuests: () => readonly ReturnType<typeof questContract.parse>[];
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const verifyProxy = questVerifyBrokerProxy();
  const spawnProxy = agentSpawnByRoleBrokerProxy();
  questWorkItemInsertBrokerProxy();

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
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      verifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnOnce({ lines: spawnLines, exitCode });
    },

    setupVerifyPass: ({
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
      // Order: spawn -> verify -> modify(complete) -> get(quest) -> modify(items)
      spawnProxy.setupSpawnOnce({ lines: spawnLines, exitCode });
      verifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupSpawnFailure: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnFailureOnce();
    },

    setupSpawnSuccessVerifyFail: ({
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
      // Order: spawn -> verify(fail) -> modify(failed) -> get(retry) -> modify(insert)
      spawnProxy.setupSpawnOnce({ lines: spawnLines, exitCode });
      verifyProxy.setupEmptyFolder();
      modifyProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupSpawnCrashVerifyFail: ({ quest }: { quest: Quest }): void => {
      // Order: spawn(crash) -> verify(fail) -> modify(failed) -> get(retry) -> modify(insert)
      spawnProxy.setupSpawnFailureOnce();
      verifyProxy.setupEmptyFolder();
      modifyProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
    },

    setupSecondGetFailure: ({
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
      // Same as setupVerifyPass: spawn -> verify -> modify(complete) -> get(quest)
      // But set up get to return empty folder so it fails
      spawnProxy.setupSpawnOnce({ lines: spawnLines, exitCode });
      verifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      getProxy.setupEmptyFolder();
    },

    setupDeterministicUuids: ({ uuids }: { uuids: readonly string[] }): void => {
      const counter = { value: 0 };
      const mock = jest.spyOn(crypto, 'randomUUID');
      mock.mockImplementation(() => {
        const uuid =
          uuids[counter.value] ?? uuids[uuids.length - 1] ?? 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
        counter.value += 1;
        return uuid as ReturnType<typeof crypto.randomUUID>;
      });
    },

    getPersistedQuestJsons: (): readonly unknown[] => modifyProxy.getAllPersistedContents(),

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),

    getLastPersistedQuest: (): ReturnType<typeof questContract.parse> => {
      const persisted = modifyProxy.getAllPersistedContents();
      const lastWrite = persisted[persisted.length - 1];
      return questContract.parse(JSON.parse(String(lastWrite)));
    },

    getAllPersistedQuests: (): readonly ReturnType<typeof questContract.parse>[] => {
      const persisted = modifyProxy.getAllPersistedContents();
      return persisted.map((content) => questContract.parse(JSON.parse(String(content))));
    },
  };
};
