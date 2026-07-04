/**
 * PURPOSE: Proxy for quest-modify-broker that mocks quest find, quest load, and write operations
 *
 * USAGE:
 * const proxy = questModifyBrokerProxy();
 * proxy.setupQuestFound({ quest });
 * proxy.setupReject({ error: new Error('network failure') }); // makes next call reject
 *
 * WHY registerModuleMock: questModifyBroker needs a global passthrough to the real implementation
 * so ANY caller (e.g., quest-orchestration-loop-broker) gets the real code with mocked sub-dependencies.
 * registerMock's stack-based dispatch only matches calls from files containing the callerPath,
 * which breaks when a different broker calls questModifyBroker. registerModuleMock + jest.mocked
 * preserves the original jest.mock + jest.requireActual pattern that applies globally.
 */

import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  ModifyQuestResultStub,
} from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import {
  registerModuleMock,
  registerSpyOn,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { questModifyBroker } from './quest-modify-broker';
import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { questPersistBrokerProxy } from '../persist/quest-persist-broker.proxy';
import { withQuestModifyLockLayerBrokerProxy } from './with-quest-modify-lock-layer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

// Auto-mock so all callers get the mocked version globally
registerModuleMock({ module: './quest-modify-broker' });

export const questModifyBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupEmptyFolder: () => void;
  setupReject: (params: { error: Error }) => void;
  setupResolveSuccessOnce: () => void;
  setupResolveFailureOnce: () => void;
  setupContractSourceResolvesOnce: () => void;
  setupAssertionIds: (params: {
    ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getCallInputs: () => readonly unknown[];
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  // Server-stamped assertion ids come from crypto.randomUUID. Passthrough so every test gets a real
  // uuid by default; tests that assert on the stamped id queue deterministic values via setupAssertionIds.
  const uuidSpy = registerSpyOn({ object: crypto, method: 'randomUUID', passthrough: true });
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();
  const persistProxy = questPersistBrokerProxy();
  const lockLayerProxy = withQuestModifyLockLayerBrokerProxy();
  lockLayerProxy.setupEmpty();
  // questModifyBroker calls fsIsAccessibleAdapter once per contract entry to resolve
  // source paths against disk. Default to "not found" so 'new' contracts (the common
  // test-stub default) pass the contract-source-resolution validator. Tests that need
  // a path to appear "existing" can override via the proxy's `resolves()` method.
  const fsAccessProxy = fsIsAccessibleAdapterProxy();
  fsAccessProxy.defaultsToNotFound();

  // Re-apply passthrough to actual implementation (resetAllMocks clears between tests)
  const realMod = requireActual<{ questModifyBroker: typeof questModifyBroker }>({
    module: './quest-modify-broker',
  });
  (questModifyBroker as jest.MockedFunction<typeof questModifyBroker>).mockImplementation(
    realMod.questModifyBroker,
  );

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      const guildId = GuildIdStub();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds',
      });
      const questsDirPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`,
      });
      const questFilePath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`,
      });

      findQuestPathProxy.setupQuestFound({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath,
            questFolders: [
              {
                folderName: FileNameStub({ value: quest.folder }),
                questFilePath,
                questFolderPath,
                contents: FileContentsStub({ value: JSON.stringify(quest) }),
              },
            ],
          },
        ],
      });

      // pathJoin for questModifyBroker joining questPath + quest.json
      pathJoinProxy.returns({ result: questFilePath });

      // questLoadBroker reads the quest file
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      // Mock persist (write + outbox)
      persistProxy.setupPersist({
        homePath,
        outboxFilePath: FilePathStub({ value: '/home/testuser/.dungeonmaster/outbox.jsonl' }),
      });
    },

    setupReject: ({ error }: { error: Error }): void => {
      (questModifyBroker as jest.MockedFunction<typeof questModifyBroker>).mockRejectedValueOnce(
        error,
      );
    },

    // Resolve { success: true } for the next call without running the real read-modify-write —
    // isolates a caller's handling of a successful persist.
    setupResolveSuccessOnce: (): void => {
      (questModifyBroker as jest.MockedFunction<typeof questModifyBroker>).mockResolvedValueOnce(
        ModifyQuestResultStub(),
      );
    },

    // Resolve { success: false } for the next call — questModifyBroker swallows I/O and validation
    // failures into a falsy result rather than throwing, so callers that must not silently drop a
    // failed persist are tested against this resolved-failure shape (not a rejection).
    setupResolveFailureOnce: (): void => {
      (questModifyBroker as jest.MockedFunction<typeof questModifyBroker>).mockResolvedValueOnce(
        ModifyQuestResultStub({ success: false }),
      );
    },

    // Queues one fs.access success so the contract-source-resolution validator
    // sees the next contract source as "exists on disk." Use this for tests that
    // exercise `status: 'existing'` or `status: 'modified'` contracts, or that
    // intentionally trigger a `status: 'new'`-with-existing-path rejection.
    setupContractSourceResolvesOnce: (): void => {
      fsAccessProxy.resolves();
    },

    setupAssertionIds: ({
      ids,
    }: {
      ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
    }): void => {
      for (const id of ids) {
        uuidSpy.mockReturnValueOnce(id);
      }
    },

    // Raw `input` argument of every questModifyBroker call this test made — works whether the
    // call ran the real implementation or a queued setupResolve*Once value.
    getCallInputs: (): readonly unknown[] =>
      (questModifyBroker as jest.MockedFunction<typeof questModifyBroker>).mock.calls.map(
        (call) => call[0].input,
      ),

    getAllPersistedContents: (): readonly unknown[] =>
      persistProxy
        .getAllWrittenFiles()
        .filter(({ path }) => {
          const pathStr = String(path);
          // Writes go to quest.json.tmp then rename to quest.json; capture tmp writes.
          return pathStr.endsWith('quest.json') || pathStr.endsWith('quest.json.tmp');
        })
        .map(({ content }) => content),

    setupEmptyFolder: (): void => {
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds',
      });

      findQuestPathProxy.setupNoGuilds({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
      });
    },
  };
};
