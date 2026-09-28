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
 * decided anything.
 *
 * EVERY MODULE THIS FILE MOCKS IS POINTED BACK AT ITS REAL IMPLEMENTATION AT CONSTRUCTION, and that
 * is load-bearing. A caller's proxy IMPORTS this file, so these `jest.mock` calls are hoisted for
 * that whole suite; left unstaged they would make the mocked wrappers throw for a caller that never
 * asked for any of this. Pointed at the real thing, each one still resolves through whatever the
 * caller staged at the npm boundary — exactly as if this file were not there. `setupPassthrough` is
 * what swaps them for the virtual store.
 */

import { existsSync, readdirEntriesSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';

import { dungeonmasterHomeFindBroker } from '@dungeonmaster/shared/brokers';
import {
  adapterResultContract,
  fileContentsContract,
  filePathContract,
  questContract,
} from '@dungeonmaster/shared/contracts';
import type {
  FileContents,
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
  plannedWorkReadBrokerProxy();
  questFindQuestPathBrokerProxy();
  questLoadBrokerProxy();
  questOperationsUpdateBrokerProxy();
  mintNextFamilyLayerBrokerProxy();

  // Every mocked module, pointed back at the real thing. See this file's header: the mocks are
  // hoisted for any suite that imports this proxy, and these restore the behaviour that suite had.
  const realBrokers = requireActual<{
    dungeonmasterHomeFindBroker: typeof dungeonmasterHomeFindBroker;
  }>({ module: '@dungeonmaster/shared/brokers' });

  const homeFindHandle = registerMock({ fn: dungeonmasterHomeFindBroker });
  homeFindHandle.calledWith([]).implement(realBrokers.dungeonmasterHomeFindBroker as never);

  // questFindQuestPathBroker (composed above via questFindQuestPathBrokerProxy for
  // enforce-proxy-child-creation, but discarded — its OWN scenarios build a fs layout this file
  // does not need) reaches these three through the gateway.
  // Mocked at the WRAPPER, not through the dedicated `exists-sync.proxy`/`readdir-entries-sync.proxy`
  // gateway proxies: those compose only for the file that IMPORTS the gateway name directly
  // (`quest-find-quest-path-broker.ts`), and `enforce-proxy-child-creation` refuses them here, where
  // the implementation is `quest-route-scope-broker.ts`.
  //
  // Defaulted to the REAL WRAPPER implementation, not a fabricated value: `existsSync`/
  // `readdirEntriesSync` are ALSO called, for OTHER quests, by every other broker this test
  // composes through `questGetBrokerProxy`/`questAdvanceBrokerProxy` (both reach
  // questFindQuestPathBroker too, staged via ITS OWN `existsSyncProxy`/`readdirEntriesSyncProxy` —
  // which mock RAW `fs`, one layer below this wrapper). Mocking this wrapper with no default would
  // swallow every one of those calls before they ever reach the raw-fs mock that answers them;
  // real-passthrough lets an unstaged call fall through to the wrapper's own body, which still
  // calls the (separately mocked) raw fs underneath.
  const realGatewayFs = requireActual<{
    existsSync: typeof existsSync;
    readdirEntriesSync: typeof readdirEntriesSync;
  }>({ module: '#gateway/node/fs' });
  const gatewayExistsHandle = registerMock({ fn: existsSync });
  gatewayExistsHandle.calledWith([]).implement(realGatewayFs.existsSync as never);
  const gatewayReaddirHandle = registerMock({ fn: readdirEntriesSync });
  gatewayReaddirHandle.calledWith([]).implement(realGatewayFs.readdirEntriesSync as never);
  // `join` is pure with nothing to virtualize — real passthrough by default, matching every other
  // migrated caller's own proxy (see quest-get-broker.proxy.ts, quest-modify-broker.proxy.ts).
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const gatewayJoinHandle = registerMock({ fn: join });
  gatewayJoinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

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
      // argument it was invoked with out of the shared `files` state.

      homeFindHandle
        .calledWith([])
        .implement((() => ({ homePath: filePathContract.parse(HOME_PATH) })) as never);

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
      files.set(questFilePath, fileContentsContract.parse(JSON.stringify(quest)));
      questFilePathRef.value = questFilePath;

      // questFindQuestPathBroker's own guild listing and per-guild quest scan, addressed by the
      // exact known directories this store's one guild holds — never an address-less catch-all.
      gatewayReaddirHandle
        .calledWith([GUILDS_DIR])
        .returns([{ name: GUILD_ID, kind: 'directory' }]);
      gatewayReaddirHandle
        .calledWith([QUESTS_DIR])
        .returns([{ name: String(quest.folder), kind: 'directory' }]);
      // The probe's own join keys its last segment on `questId`, not `folder` — this store only
      // ever holds the quest under its FOLDER name, so the probe's exact candidate path is
      // addressed as an explicit miss (matching `quest-find-quest-path-broker.proxy.ts`'s own
      // convention) and the real broker falls through to the scan above, which does hold it.
      gatewayExistsHandle
        .calledWith([`${QUESTS_DIR}/${String(quest.id)}/quest.json`])
        .returns(false);
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
