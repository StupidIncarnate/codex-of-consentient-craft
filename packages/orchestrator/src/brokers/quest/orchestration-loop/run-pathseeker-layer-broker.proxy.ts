import type { ExitCode } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';

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
  setupSpawnFailure: (params: { quest: Quest }) => void;
  setupSpawnAborted: (params: { quest: Quest }) => void;
  setupVerifyFail: (params: {
    quest: Quest;
    spawnLines: Parameters<
      ReturnType<typeof agentSpawnByRoleBrokerProxy>['setupSpawnOnce']
    >[0]['lines'];
    exitCode: ExitCode;
  }) => void;
  setupQuestNotFound: () => void;
  setupDeterministicUuids: (params: { uuids: readonly string[] }) => void;
  getUuidCalls: () => readonly unknown[];
  getPersistedQuestJsons: () => readonly unknown[];
  getSpawnedArgs: () => unknown;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const verifyProxy = questVerifyBrokerProxy();
  const spawnProxy = agentSpawnByRoleBrokerProxy();
  const insertProxy = questWorkItemInsertBrokerProxy();

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
      insertProxy.setupQuestModify({ quest });
      spawnProxy.setupSpawnOnce({ lines: spawnLines, exitCode });
    },

    setupSpawnFailure: ({ quest }: { quest: Quest }): void => {
      // Spawn failure path: spawn crashes, verify still runs, then modify + get + insert
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      verifyProxy.setupQuestFound({ quest });
      insertProxy.setupQuestModify({ quest });
      spawnProxy.setupSpawnFailureOnce();
    },

    setupVerifyFail: ({
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
      // Verify fail path needs: verify + modify(failed) + get + modify(insert via insertBroker)
      // Generous mock setups to ensure values are not exhausted
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      verifyProxy.setupQuestFound({ quest });
      verifyProxy.setupQuestFound({ quest });
      insertProxy.setupQuestModify({ quest });
      insertProxy.setupQuestModify({ quest });
      spawnProxy.setupSpawnOnce({ lines: spawnLines, exitCode });
    },

    setupSpawnAborted: ({ quest }: { quest: Quest }): void => {
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnFailureOnce();
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
      modifyProxy.setupEmptyFolder();
      verifyProxy.setupEmptyFolder();
      spawnProxy.setupSpawnFailureOnce();
    },

    setupDeterministicUuids: ({ uuids }: { uuids: readonly string[] }): void => {
      const counter = { value: 0 };
      const spy = jest.spyOn(crypto, 'randomUUID');
      spy.mockImplementation(() => uuids[counter.value++] as ReturnType<typeof crypto.randomUUID>);
    },

    getUuidCalls: (): readonly unknown[] => {
      const mock = jest.spyOn(crypto, 'randomUUID');
      return mock.mock.calls;
    },

    getPersistedQuestJsons: (): readonly unknown[] =>
      modifyProxy
        .getAllPersistedContents()
        .map((content) =>
          typeof content === 'string' ? (JSON.parse(content) as unknown) : content,
        ),

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),
  };
};
