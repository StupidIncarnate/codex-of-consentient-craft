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

import { randomUUID } from '#gateway/node/crypto';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { join, resolve } from '#gateway/node/path';

import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { ModifyQuestResultStub } from '@dungeonmaster/shared/contracts/modify-quest-result/modify-quest-result.stub';
import { RepoRootCwdStub } from '@dungeonmaster/shared/contracts/repo-root-cwd/repo-root-cwd.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { questModifyBroker } from './quest-modify-broker';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { questPersistBrokerProxy } from '../persist/quest-persist-broker.proxy';
import { questRepoRootBrokerProxy } from '../repo-root/quest-repo-root-broker.proxy';
import { questWithModifyLockBrokerProxy } from '../with-modify-lock/quest-with-modify-lock-broker.proxy';
import { resolvePackageEntryFactsLayerBrokerProxy } from './resolve-package-entry-facts-layer-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type ModifyInput = Parameters<typeof questModifyBroker>[0]['input'];
type ModifyResult = Awaited<ReturnType<typeof questModifyBroker>>;

// The repo every quest in this file targets. Package entry locations are repo-relative to it, so a
// test staging one on disk names `${PROJECT_ROOT}/<location>` — the address the broker really
// probes.
const PROJECT_ROOT = RepoRootCwdStub({ value: '/home/testuser/my-guild' });

// Auto-mock so all callers get the mocked version globally
registerModuleMock({ module: './quest-modify-broker' });

export const questModifyBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupEmptyFolder: () => void;
  // Runs the real broker for any `{ input }` call, for a call that fails on its own input before
  // any quest is looked up.
  setupRealBroker: () => void;
  setupReject: (params: { error: Error }) => void;
  setupResolveSuccessOnce: () => void;
  setupResolveFailureOnce: () => void;
  // Answers one exact `input` with a caller-chosen result, sticky — so two hops with different
  // inputs each get their own answer. Any other input runs the real broker.
  setupResolves: (params: { input: ModifyInput; result: ModifyResult }) => void;
  setupContractSourceResolvesOnce: (params: { source: string }) => void;
  setupPackageLocationResolves: (params: { location: string }) => void;
  getProjectRoot: () => ReturnType<typeof RepoRootCwdStub>;
  setupAssertionIds: (params: {
    ids: readonly `${string}-${string}-${string}-${string}-${string}`[];
  }) => void;
  getAllPersistedContents: () => readonly unknown[];
  getCallInputs: () => readonly unknown[];
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  // Server-stamped assertion ids come from randomUUID. Passthrough so every test gets a real
  // uuid by default; tests that assert on the stamped id queue deterministic values via setupAssertionIds.
  const uuidSpy = registerMock({ fn: randomUUID });
  const realCrypto = requireActual<{ randomUUID: typeof randomUUID }>({
    module: '#gateway/node/crypto',
  });
  uuidSpy.calledWith([]).implement(() => realCrypto.randomUUID());
  // questModifyBroker's own join(questPath, quest.json) -> questFilePath, addressed by the exact
  // tuple below (never an address-less FIFO slot), so it can never answer a different broker's
  // join call sharing the same underlying mocked `join`.
  const joinHandle = registerMock({ fn: join });
  // Left on its real `path.resolve` passthrough: anchoring a declared contract source on the quest's
  // own project root is the behaviour under test, so the broker computes the probed address for real
  // and setupContractSourceResolvesOnce names the absolute result it expects it to reach.
  const realPath = requireActual<{ resolve: typeof resolve }>({ module: 'path' });
  registerMock({ fn: resolve })
    .calledWith([])
    .implement((...segments: never[]) => realPath.resolve(...segments));
  const loadProxy = questLoadBrokerProxy();
  const persistProxy = questPersistBrokerProxy();
  const lockProxy = questWithModifyLockBrokerProxy();
  lockProxy.setupEmpty();
  // questModifyBroker calls pathExists once per contract entry to resolve source paths against
  // disk, each anchored on PROJECT_ROOT. Every path UNDER that root defaults to "not found" so 'new'
  // contracts (the common test-stub default) pass the contract-source-resolution validator; the
  // predicate names the quest's own repo and nothing else. Tests that need a path to appear
  // "existing" stage the exact address, which outranks the predicate.
  const fsAccessProxy = pathExistsProxy();
  fsAccessProxy.throwsMatchingPath({
    path: (value: unknown): boolean => String(value).startsWith(`${PROJECT_ROOT}/`),
    error: FsErrorStub({ code: 'ENOENT' }),
  });
  // Answers the package-entry disk probes: nothing resolves and no workspace root lists siblings
  // until a test says otherwise via setupPackageLocationResolves.
  resolvePackageEntryFactsLayerBrokerProxy();
  // The quest's own repo root, answered outright: the real broker would re-run the quest lookup and
  // consume a second copy of the path/read staging setupQuestFound seeds for questModifyBroker's own
  // lookup.
  const repoRootProxy = questRepoRootBrokerProxy();
  repoRootProxy.setupRepoRoot({ repoRoot: PROJECT_ROOT });

  // Any `{ input }` call. `setupQuestFound` stages the real implementation at this address, and
  // setupReject/setupResolveSuccessOnce/setupResolveFailureOnce below stage live one-shots at the
  // same address, which win over that sticky passthrough for exactly one call, then fall back to it.
  const isModifyCall = (call: unknown): boolean =>
    typeof call === 'object' && call !== null && 'input' in call;
  const realMod = requireActual<{ questModifyBroker: typeof questModifyBroker }>({
    module: './quest-modify-broker',
  });
  const modifyMock = registerMock({ fn: questModifyBroker });

  return {
    setupResolves: ({ input, result }: { input: ModifyInput; result: ModifyResult }): void => {
      modifyMock.calledWith([{ input }]).resolves(result);
    },

    setupRealBroker: (): void => {
      modifyMock.calledWith([isModifyCall]).implement(realMod.questModifyBroker as never);
    },

    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      modifyMock.calledWith([isModifyCall]).implement(realMod.questModifyBroker as never);
      const guildId = GuildIdStub();
      const homePath = '/home/testuser/.dungeonmaster';
      const guildsDir = '/home/testuser/.dungeonmaster/guilds';
      const questsDirPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;
      const questFolderPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`;
      const questFilePath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`;

      findQuestPathProxy.setupQuestFound({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
        guilds: [
          {
            dirName: guildId,
            questsDirPath,
            questFolders: [
              {
                folderName: quest.folder,
                questFilePath,
                questFolderPath,
                contents: JSON.stringify(quest),
              },
            ],
          },
        ],
      });

      joinHandle
        .calledWith([questFolderPath, locationsStatics.quest.questFile])
        .returns(questFilePath);

      // questLoadBroker reads the quest file
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      // Mock persist (write + outbox)
      persistProxy.setupPersist({
        questFilePath,
        homePath,
        outboxFilePath: '/home/testuser/.dungeonmaster/outbox.jsonl',
      });
    },

    setupReject: ({ error }: { error: Error }): void => {
      modifyMock.onceFor([isModifyCall]).rejects(error);
    },

    // Resolve { success: true } for the next call without running the real read-modify-write —
    // isolates a caller's handling of a successful persist.
    setupResolveSuccessOnce: (): void => {
      modifyMock.onceFor([isModifyCall]).resolves(ModifyQuestResultStub());
    },

    // Resolve { success: false } for the next call — questModifyBroker swallows I/O and validation
    // failures into a falsy result rather than throwing, so callers that must not silently drop a
    // failed persist are tested against this resolved-failure shape (not a rejection).
    setupResolveFailureOnce: (): void => {
      modifyMock.onceFor([isModifyCall]).resolves(ModifyQuestResultStub({ success: false }));
    },

    // Stages fs.access to succeed for one contract's source path, so the
    // contract-source-resolution validator sees THAT source as "exists on disk." Use this
    // for tests that exercise `status: 'existing'` or `status: 'modified'` contracts, or
    // that intentionally trigger a `status: 'new'`-with-existing-path rejection. A contract's
    // `source` is repo-relative to the quest's OWN repo, so the address the broker probes is
    // that source anchored on PROJECT_ROOT; pass the same absolute path here — exactly as
    // setupPackageLocationResolves takes a location's absolute address.
    setupContractSourceResolvesOnce: ({ source }: { source: string }): void => {
      fsAccessProxy.present({ path: source });
    },

    // Stages fs.access to succeed for one packagesAffected entry's `location`, so the package-entry
    // validator sees that package as present on disk — which is what an `edit` or `delete` entry
    // asserts. The entry's `location` is repo-relative to the quest's own repo, so the address the
    // broker probes is that location anchored on PROJECT_ROOT; pass the same absolute path here.
    setupPackageLocationResolves: ({ location }: { location: string }): void => {
      fsAccessProxy.present({ path: location });
    },

    getProjectRoot: (): ReturnType<typeof RepoRootCwdStub> => PROJECT_ROOT,

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
      modifyMock.calledWith([isModifyCall]).implement(realMod.questModifyBroker as never);
      const homePath = '/home/testuser/.dungeonmaster';
      const guildsDir = '/home/testuser/.dungeonmaster/guilds';

      findQuestPathProxy.setupNoGuilds({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
      });
    },
  };
};
