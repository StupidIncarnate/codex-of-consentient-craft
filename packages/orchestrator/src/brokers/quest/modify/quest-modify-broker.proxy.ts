/**
 * PURPOSE: Proxy for quest-modify-broker that mocks quest find, quest load, and write operations
 *
 * USAGE:
 * const proxy = questModifyBrokerProxy();
 * proxy.setupQuestFound({ quest });
 * proxy.setupReject({ error: new Error('network failure') }); // makes next call reject
 *
 * WHY registerModuleMock: questModifyBroker must be a mockable jest.fn() so ANY caller (e.g.,
 * quest-orchestration-loop-broker) resolves through the mocked module instead of the real
 * function reference captured at their own import time. registerModuleMock (auto-mock, no
 * factory) is what replaces the module's export with a jest.fn(); the handle staged below then
 * answers every call to it globally — calledWith/onceFor address by ARGUMENTS, not by which file
 * is calling, so every composing proxy (this one's own child callers included) sees the same
 * passthrough-by-default behaviour.
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
  registerMock,
  registerModuleMock,
  registerSpyOn,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { questModifyBroker } from './quest-modify-broker';
import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { questPersistBrokerProxy } from '../persist/quest-persist-broker.proxy';
import { questWithModifyLockBrokerProxy } from '../with-modify-lock/quest-with-modify-lock-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

// Auto-mock so all callers get the mocked version globally
registerModuleMock({ module: './quest-modify-broker' });

export const questModifyBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupEmptyFolder: () => void;
  setupReject: (params: { error: Error }) => void;
  setupResolveSuccessOnce: () => void;
  setupResolveFailureOnce: () => void;
  setupContractSourceResolvesOnce: (params: { source: string }) => void;
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
  const lockProxy = questWithModifyLockBrokerProxy();
  lockProxy.setupEmpty();
  // questModifyBroker calls fsIsAccessibleAdapter once per contract entry to resolve
  // source paths against disk. Default to "not found" so 'new' contracts (the common
  // test-stub default) pass the contract-source-resolution validator. Tests that need
  // a path to appear "existing" can override via the proxy's `resolves()` method.
  const fsAccessProxy = fsIsAccessibleAdapterProxy();
  fsAccessProxy.defaultsToNotFound();

  // Re-apply passthrough to the actual implementation (resetAllMocks clears between tests).
  // `input` varies per call and the passthrough runs the REAL logic against whatever it
  // receives rather than answering a canned value, so there is no per-input address to stage —
  // `[]` is the honest, generic catch-all. setupReject/setupResolveSuccessOnce/
  // setupResolveFailureOnce below stage live one-shots at the same `[]` address, which win over
  // this sticky passthrough for exactly one call, then fall back to it.
  const realMod = requireActual<{ questModifyBroker: typeof questModifyBroker }>({
    module: './quest-modify-broker',
  });
  const modifyMock = registerMock({ fn: questModifyBroker });
  modifyMock.calledWith([]).implement(realMod.questModifyBroker as never);

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
        questFilePath,
        homePath,
        outboxFilePath: FilePathStub({ value: '/home/testuser/.dungeonmaster/outbox.jsonl' }),
      });
    },

    setupReject: ({ error }: { error: Error }): void => {
      modifyMock.onceFor([]).rejects(error);
    },

    // Resolve { success: true } for the next call without running the real read-modify-write —
    // isolates a caller's handling of a successful persist.
    setupResolveSuccessOnce: (): void => {
      modifyMock.onceFor([]).resolves(ModifyQuestResultStub());
    },

    // Resolve { success: false } for the next call — questModifyBroker swallows I/O and validation
    // failures into a falsy result rather than throwing, so callers that must not silently drop a
    // failed persist are tested against this resolved-failure shape (not a rejection).
    setupResolveFailureOnce: (): void => {
      modifyMock.onceFor([]).resolves(ModifyQuestResultStub({ success: false }));
    },

    // Stages fs.access to succeed for one contract's normalized source path, so the
    // contract-source-resolution validator sees THAT source as "exists on disk." Use this
    // for tests that exercise `status: 'existing'` or `status: 'modified'` contracts, or
    // that intentionally trigger a `status: 'new'`-with-existing-path rejection. `source`
    // must be the same bare/relative string the test's input contract entry carries — the
    // broker normalizes it (prefixes `./` unless already absolute or relative) before
    // calling fsIsAccessibleAdapter, so this mirrors that normalization to describe the
    // real call.
    setupContractSourceResolvesOnce: ({ source }: { source: string }): void => {
      const normalized =
        source.startsWith('/') || source.startsWith('./') || source.startsWith('../')
          ? source
          : `./${source}`;
      fsAccessProxy.resolves({ filePath: FilePathStub({ value: normalized }) });
    },

    setupAssertionIds: ({
      ids,
    }: {
      ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
    }): void => {
      for (const id of ids) {
        uuidSpy.onceFor([]).returns(id);
      }
    },

    // Raw `input` argument of every questModifyBroker call this test made — works whether the
    // call ran the real implementation or a queued setupResolve*Once value.
    getCallInputs: (): readonly unknown[] =>
      modifyMock.callsMatching([]).map((call) => {
        const [params] = call as [Parameters<typeof questModifyBroker>[0]];
        return params.input;
      }),

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
