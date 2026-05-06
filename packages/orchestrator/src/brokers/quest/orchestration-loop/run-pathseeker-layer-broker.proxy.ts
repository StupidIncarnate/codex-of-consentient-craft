import type { ExitCode } from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { SpyOnHandle } from '@dungeonmaster/testing/register-mock';

import { agentSpawnByRoleBrokerProxy } from '../../agent/spawn-by-role/agent-spawn-by-role-broker.proxy';
import { questGetBrokerProxy } from '../get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../modify/quest-modify-broker.proxy';
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
  setupQuestNotFound: () => void;
  setupDeterministicUuids: (params: { uuids: readonly string[] }) => void;
  setupModifyReject: (params: { error: Error }) => void;
  setupStderrCapture: () => void;
  getStderrWrites: () => readonly unknown[];
  getUuidCalls: () => readonly unknown[];
  getPersistedQuestJsons: () => readonly unknown[];
  getSpawnedArgs: () => unknown;
} => {
  const getProxy = questGetBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const spawnProxy = agentSpawnByRoleBrokerProxy();
  const insertProxy = questWorkItemInsertBrokerProxy();
  const stderrSpy: { current: SpyOnHandle | null } = { current: null };
  const uuidSpy: { current: SpyOnHandle | null } = { current: null };

  registerSpyOn({ object: Date.prototype, method: 'toISOString' }).mockReturnValue(
    '2024-01-15T10:00:00.000Z',
  );

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
      // Three quest fetches: initial (sessionId resolution), post-completion (steps),
      // plus a third buffer for any disk-fallback path inside agentSpawnByRoleBroker that
      // happens to consume the get-broker mock chain. The mockResolvedValueOnce-style
      // proxy returns empty after the queue is exhausted, so over-seeding is safer than
      // under-seeding.
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      insertProxy.setupQuestModify({ quest });
      spawnProxy.setupSpawnOnce({ lines: spawnLines, exitCode });
    },

    setupSpawnFailure: ({ quest }: { quest: Quest }): void => {
      // Spawn failure path: initial fetch + spawn crashes + modify(failed) + get + insert
      getProxy.setupQuestFound({ quest }); // initial fetch for sessionId resolution
      getProxy.setupQuestFound({ quest });
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      insertProxy.setupQuestModify({ quest });
      spawnProxy.setupSpawnFailureOnce();
    },

    setupSpawnAborted: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest }); // initial fetch for sessionId resolution
      modifyProxy.setupQuestFound({ quest });
      spawnProxy.setupSpawnFailureOnce();
    },

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
      modifyProxy.setupEmptyFolder();
      spawnProxy.setupSpawnFailureOnce();
    },

    setupDeterministicUuids: ({ uuids }: { uuids: readonly string[] }): void => {
      // Pad with one filler at the front to absorb agentLaunchBroker's processId
      // crypto.randomUUID() call so the rest of the deterministic queue lines up with
      // the broker's own work-item ID minting. Distinct fillers per call so workItem-id
      // uniqueness validation in the modify path doesn't reject duplicates.
      const padded = [
        '00000000-0000-4000-8000-aaaaaaaaaaa1',
        ...uuids,
        '00000000-0000-4000-8000-aaaaaaaaaab2',
        '00000000-0000-4000-8000-aaaaaaaaaab3',
        '00000000-0000-4000-8000-aaaaaaaaaab4',
        '00000000-0000-4000-8000-aaaaaaaaaab5',
        '00000000-0000-4000-8000-aaaaaaaaaab6',
        '00000000-0000-4000-8000-aaaaaaaaaab7',
        '00000000-0000-4000-8000-aaaaaaaaaab8',
      ];
      const counter = { value: 0 };
      const spy = registerSpyOn({ object: crypto, method: 'randomUUID' });
      spy.mockImplementation(() => {
        const callIdx = counter.value;
        counter.value += 1;
        return (padded[callIdx] ?? padded[padded.length - 1]) as ReturnType<
          typeof crypto.randomUUID
        >;
      });
      uuidSpy.current = spy;
    },

    getUuidCalls: (): readonly unknown[] => uuidSpy.current?.mock.calls ?? [],

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

    getPersistedQuestJsons: (): readonly unknown[] =>
      modifyProxy
        .getAllPersistedContents()
        .map((content) =>
          typeof content === 'string' ? (JSON.parse(content) as unknown) : content,
        ),

    getSpawnedArgs: (): unknown => spawnProxy.getSpawnedArgs(),
  };
};
