/**
 * PURPOSE: Proxy for questRouteScopeBroker — two roles:
 *   1) Downstream callers (the dispatch scan) stub the broker via `setupRouted` /
 *      `setupRouterBlocked`, which is all they are answerable for: the scan owns the ORDER the
 *      router runs in, not what it decides.
 *   2) The broker's own test runs the real implementation (`setupPassthrough`) against a virtual
 *      quest-file store, so the router, every transformer under it, the real
 *      questOperationsUpdateBroker and the real family-mint walk all run against code.
 *
 * USAGE (caller test):
 * const proxy = questRouteScopeBrokerProxy();
 * proxy.setupRouterBlocked();
 *
 * USAGE (broker test):
 * const proxy = questRouteScopeBrokerProxy();
 * proxy.setupPassthrough();
 * proxy.setupQuest({ quest });
 * // ...call the broker...
 * expect(proxy.getPersistedQuest().workItems).toStrictEqual([...]);
 *
 * A VIRTUAL STORE RATHER THAN CALL-ORDERED PATH STAGING, because this broker reads the quest TWICE
 * — once for its own scan, once inside `questOperationsUpdateBroker`'s lock — and a one-shot queue
 * cannot survive two walks: the second finds nothing and the lookup throws before the broker has
 * decided anything. `questRunWardBrokerProxy` reaches for the same store for the same reason.
 *
 * EVERY MODULE THIS FILE MOCKS IS POINTED BACK AT ITS REAL IMPLEMENTATION AT CONSTRUCTION, and that
 * is load-bearing. A caller's proxy IMPORTS this file, so these `jest.mock` calls are hoisted for
 * that whole suite; left unstaged they would make `pathJoinAdapter` throw for a caller that never
 * asked for any of this. Pointed at the real thing, each adapter still resolves through whatever the
 * caller staged at the npm boundary — exactly as if this file were not there. `setupPassthrough` is
 * what swaps them for the virtual store.
 */

import { Dirent } from 'fs';

import {
  fsExistsSyncAdapter,
  fsReaddirWithTypesAdapter,
  pathJoinAdapter,
} from '@dungeonmaster/shared/adapters';
import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  adapterResultContract,
  fileContentsContract,
  fileNameContract,
  filePathContract,
  questContract,
} from '@dungeonmaster/shared/contracts';
import type {
  FileContents,
  FileName,
  FilePath,
  OperationItemId,
  Quest,
  QuestStub,
} from '@dungeonmaster/shared/contracts';
import {
  registerMock,
  registerModuleMock,
  registerSpyOn,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { fsAppendFileAdapter } from '../../../adapters/fs/append-file/fs-append-file-adapter';
import { fsIsAccessibleAdapter } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsRenameAdapter } from '../../../adapters/fs/rename/fs-rename-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import type { WorkPlanStub } from '../../../contracts/work-plan/work-plan.stub';
import { plannedWorkReadBrokerProxy } from '../../planned-work/read/planned-work-read-broker.proxy';
import { questBlockOnFailureBroker } from '../block-on-failure/quest-block-on-failure-broker';
import { questBlockOnFailureBrokerProxy } from '../block-on-failure/quest-block-on-failure-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';
import { questOperationsUpdateBrokerProxy } from '../operations-update/quest-operations-update-broker.proxy';
import { mintNextFamilyLayerBrokerProxy } from './mint-next-family-layer-broker.proxy';
import { questRouteScopeBroker } from './quest-route-scope-broker';

registerModuleMock({ module: './quest-route-scope-broker' });
registerModuleMock({
  module: '@dungeonmaster/shared/adapters',
  factory: () => ({
    ...jest.requireActual('@dungeonmaster/shared/adapters'),
    fsExistsSyncAdapter: jest.fn(),
    fsReaddirWithTypesAdapter: jest.fn(),
    pathJoinAdapter: jest.fn(),
  }),
});
registerModuleMock({
  module: '@dungeonmaster/shared/brokers',
  factory: () => ({
    ...jest.requireActual('@dungeonmaster/shared/brokers'),
    dungeonmasterHomeFindBroker: jest.fn(),
  }),
});
registerModuleMock({ module: '../../../adapters/fs/append-file/fs-append-file-adapter' });
registerModuleMock({ module: '../../../adapters/fs/is-accessible/fs-is-accessible-adapter' });
registerModuleMock({ module: '../../../adapters/fs/read-file/fs-read-file-adapter' });
registerModuleMock({ module: '../../../adapters/fs/rename/fs-rename-adapter' });
registerModuleMock({ module: '../../../adapters/fs/write-file/fs-write-file-adapter' });

type QuestInput = ReturnType<typeof QuestStub>;
type WorkPlan = ReturnType<typeof WorkPlanStub>;
// The halt broker's own parameter object. `callsMatching` hands back `unknown[][]`, which is
// genuinely all the mock knows; naming the shape through the function it recorded is the one place
// that information exists.
type BlockCall = Parameters<typeof questBlockOnFailureBroker>[0];

const HOME_PATH = '/home/testuser/.dungeonmaster';
const GUILD_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const GUILDS_DIR = `${HOME_PATH}/guilds`;
const QUESTS_DIR = `${GUILDS_DIR}/${GUILD_ID}/quests`;
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';
const PLANNED_WORK_DIR = 'planned-work';
const IDLE = { routed: false, blocked: false };

export const questRouteScopeBrokerProxy = (): {
  setupRouted: () => void;
  setupRouterBlocked: () => void;
  setupPassthrough: () => void;
  setupQuest: (params: { quest: QuestInput }) => void;
  setupPlan: (params: {
    quest: QuestInput;
    operationItemId: OperationItemId;
    plan: WorkPlan;
  }) => void;
  getPersistedQuest: () => Quest;
  getBlockCalls: () => readonly BlockCall[];
} => {
  const mocked = registerMock({ fn: questRouteScopeBroker });
  mocked.calledWith([]).resolves(IDLE);

  const blockProxy = questBlockOnFailureBrokerProxy();
  blockProxy.setupBlocked();
  const blockHandle = registerMock({ fn: questBlockOnFailureBroker });

  // Composed for enforce-proxy-child-creation against the implementation's own imports, and BEFORE
  // the real-implementation defaults below so those outrank anything these staged.
  pathJoinAdapterProxy();
  plannedWorkReadBrokerProxy();
  questFindQuestPathBrokerProxy();
  questLoadBrokerProxy();
  questOperationsUpdateBrokerProxy();
  mintNextFamilyLayerBrokerProxy();

  // Every mocked module, pointed back at the real thing. See this file's header: the mocks are
  // hoisted for any suite that imports this proxy, and these restore the behaviour that suite had.
  const realAdapters = requireActual<{
    fsExistsSyncAdapter: typeof fsExistsSyncAdapter;
    fsReaddirWithTypesAdapter: typeof fsReaddirWithTypesAdapter;
    pathJoinAdapter: typeof pathJoinAdapter;
  }>({ module: '@dungeonmaster/shared/adapters' });
  const realBrokers = requireActual<{
    dungeonmasterHomeFindBroker: typeof dungeonmasterHomeFindBroker;
  }>({ module: '@dungeonmaster/shared/brokers' });

  const pathJoinHandle = registerMock({ fn: pathJoinAdapter });
  pathJoinHandle.calledWith([]).implement(realAdapters.pathJoinAdapter as never);
  const readdirHandle = registerMock({ fn: fsReaddirWithTypesAdapter });
  readdirHandle.calledWith([]).implement(realAdapters.fsReaddirWithTypesAdapter as never);
  const existsSyncHandle = registerMock({ fn: fsExistsSyncAdapter });
  existsSyncHandle.calledWith([]).implement(realAdapters.fsExistsSyncAdapter as never);
  const homeFindHandle = registerMock({ fn: dungeonmasterHomeFindBroker });
  homeFindHandle.calledWith([]).implement(realBrokers.dungeonmasterHomeFindBroker as never);

  const realAppendFile = requireActual<{ fsAppendFileAdapter: typeof fsAppendFileAdapter }>({
    module: '../../../adapters/fs/append-file/fs-append-file-adapter',
  });
  const realIsAccessible = requireActual<{ fsIsAccessibleAdapter: typeof fsIsAccessibleAdapter }>({
    module: '../../../adapters/fs/is-accessible/fs-is-accessible-adapter',
  });
  const realReadFile = requireActual<{ fsReadFileAdapter: typeof fsReadFileAdapter }>({
    module: '../../../adapters/fs/read-file/fs-read-file-adapter',
  });
  const realRename = requireActual<{ fsRenameAdapter: typeof fsRenameAdapter }>({
    module: '../../../adapters/fs/rename/fs-rename-adapter',
  });
  const realWriteFile = requireActual<{ fsWriteFileAdapter: typeof fsWriteFileAdapter }>({
    module: '../../../adapters/fs/write-file/fs-write-file-adapter',
  });

  const appendFileHandle = registerMock({ fn: fsAppendFileAdapter });
  appendFileHandle.calledWith([]).implement(realAppendFile.fsAppendFileAdapter as never);
  const isAccessibleHandle = registerMock({ fn: fsIsAccessibleAdapter });
  isAccessibleHandle.calledWith([]).implement(realIsAccessible.fsIsAccessibleAdapter as never);
  const readFileHandle = registerMock({ fn: fsReadFileAdapter });
  readFileHandle.calledWith([]).implement(realReadFile.fsReadFileAdapter as never);
  const renameHandle = registerMock({ fn: fsRenameAdapter });
  renameHandle.calledWith([]).implement(realRename.fsRenameAdapter as never);
  const writeFileHandle = registerMock({ fn: fsWriteFileAdapter });
  writeFileHandle.calledWith([]).implement(realWriteFile.fsWriteFileAdapter as never);

  const files = new Map<FilePath, FileContents>();
  const dirs = new Map<FilePath, FileName[]>();
  const questFilePathRef = { value: filePathContract.parse('/unset/quest.json') };
  const uuidCounter = { value: 0 };

  return {
    setupRouted: (): void => {
      mocked.onceFor([]).resolves({ routed: true, blocked: false });
    },

    setupRouterBlocked: (): void => {
      mocked.onceFor([]).resolves({ routed: false, blocked: true });
    },

    setupPassthrough: (): void => {
      const realMod = requireActual<{ questRouteScopeBroker: typeof questRouteScopeBroker }>({
        module: './quest-route-scope-broker',
      });
      mocked.calledWith([]).implement(realMod.questRouteScopeBroker as never);

      // The virtual store takes over. Every implementation is a generic simulator reading the REAL
      // argument it was invoked with out of the shared `files`/`dirs` state.
      pathJoinHandle
        .calledWith([])
        .implement((({ paths }: Parameters<typeof pathJoinAdapter>[0]) =>
          filePathContract.parse(paths.join('/'))) as never);

      homeFindHandle
        .calledWith([])
        .implement((() => ({ homePath: filePathContract.parse(HOME_PATH) })) as never);

      readdirHandle.calledWith([]).implement((({
        dirPath,
      }: Parameters<typeof fsReaddirWithTypesAdapter>[0]) =>
        (dirs.get(filePathContract.parse(String(dirPath))) ?? []).map((name) =>
          Object.assign(Object.create(Dirent.prototype) as Dirent, {
            name,
            isDirectory: (): boolean => true,
          }),
        )) as never);

      existsSyncHandle
        .calledWith([])
        .implement((({ filePath }: Parameters<typeof fsExistsSyncAdapter>[0]) =>
          files.has(filePathContract.parse(String(filePath)))) as never);

      isAccessibleHandle
        .calledWith([])
        .implement((async ({ filePath }: Parameters<typeof fsIsAccessibleAdapter>[0]) =>
          Promise.resolve(files.has(filePathContract.parse(String(filePath))))) as never);

      readFileHandle.calledWith([]).implement((async ({
        filePath,
      }: Parameters<typeof fsReadFileAdapter>[0]) => {
        const contents = files.get(filePathContract.parse(String(filePath)));
        return contents === undefined
          ? Promise.reject(new Error(`Failed to read file at ${String(filePath)}`))
          : Promise.resolve(contents);
      }) as never);

      writeFileHandle.calledWith([]).implement((async ({
        filePath,
        contents,
      }: Parameters<typeof fsWriteFileAdapter>[0]) => {
        files.set(
          filePathContract.parse(String(filePath)),
          fileContentsContract.parse(String(contents)),
        );
        return Promise.resolve(adapterResultContract.parse({ success: true }));
      }) as never);

      renameHandle.calledWith([]).implement((async ({
        from,
        to,
      }: Parameters<typeof fsRenameAdapter>[0]) => {
        const fromPath = filePathContract.parse(String(from));
        const contents = files.get(fromPath);
        files.delete(fromPath);
        if (contents !== undefined) {
          files.set(filePathContract.parse(String(to)), contents);
        }
        return Promise.resolve(adapterResultContract.parse({ success: true }));
      }) as never);

      appendFileHandle
        .calledWith([])
        .implement((async () =>
          Promise.resolve(adapterResultContract.parse({ success: true }))) as never);

      // Sequenced ids and a pinned clock, so a minted scope or work item can be asserted whole.
      // Neither global takes an identifying argument, so `[]` is the honest address for both.
      registerSpyOn({ object: crypto, method: 'randomUUID' })
        .calledWith([])
        .implement((() => {
          const index = uuidCounter.value;
          uuidCounter.value += 1;
          return `00000000-0000-4000-8000-00000000000${String(index)}`;
        }) as never);
      registerSpyOn({ object: Date.prototype, method: 'toISOString' })
        .calledWith([])
        .returns(FIXED_TIMESTAMP);
    },

    setupQuest: ({ quest }: { quest: QuestInput }): void => {
      const questFilePath = filePathContract.parse(
        `${QUESTS_DIR}/${String(quest.folder)}/quest.json`,
      );
      dirs.set(filePathContract.parse(GUILDS_DIR), [fileNameContract.parse(GUILD_ID)]);
      dirs.set(filePathContract.parse(QUESTS_DIR), [fileNameContract.parse(String(quest.folder))]);
      files.set(questFilePath, fileContentsContract.parse(JSON.stringify(quest)));
      questFilePathRef.value = questFilePath;
    },

    setupPlan: ({
      quest,
      operationItemId,
      plan,
    }: {
      quest: QuestInput;
      operationItemId: OperationItemId;
      plan: WorkPlan;
    }): void => {
      files.set(
        filePathContract.parse(
          `${QUESTS_DIR}/${String(quest.folder)}/${PLANNED_WORK_DIR}/${String(operationItemId)}.json`,
        ),
        fileContentsContract.parse(JSON.stringify(plan)),
      );
    },

    getPersistedQuest: (): Quest =>
      questContract.parse(JSON.parse(String(files.get(questFilePathRef.value)))),

    getBlockCalls: (): readonly BlockCall[] =>
      blockHandle.callsMatching([]).map((call) => call[0] as BlockCall),
  };
};
