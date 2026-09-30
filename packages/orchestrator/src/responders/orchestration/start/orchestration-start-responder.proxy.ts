/**
 * PURPOSE: Proxy for OrchestrationStartResponder — composes the child broker/state proxies so the
 * responder AND the brokers it drives (questBuildRelayGraphBroker, questOperationsUpdateBroker,
 * questModifyBroker) run REAL with only the fs adapters mocked. PrepareQuestPackageGraphLayerResponder
 * is mocked directly (`registerMock({ fn: ... })`) rather than composed for real: it reads a manifest
 * per declared package, and staging those reads here would collide with this proxy's own quest.json
 * `readFile` staging (see run-chat-layer-broker.proxy.ts and chat-spawn-broker.proxy.ts for the same
 * precedent of mocking a non-adapter broker/responder in a composing proxy). Its own coverage lives
 * in prepare-quest-package-graph-layer-responder.test.ts.
 *
 * Nothing stages `child_process`, deliberately: Start is a pure quest.json transition, so any
 * child process at all is a defect, and the unit-test I/O trap (`@dungeonmaster/testing`'s
 * `jest.setup-io-trap.js`) fails the test on any unstaged `child_process` call — `spawn`, `exec`,
 * `execFile`, the sync forms — even one the code under test catches and swallows.
 *
 * crypto.randomUUID is queued with fixed ids so the processId, the relay operation-item ids, and the
 * first-work-item id are deterministic; Date.prototype.toISOString is pinned to
 * '2024-01-15T10:00:00.000Z' by the composed persist/outbox proxies so every timestamp the responder
 * stamps is deterministic too.
 *
 * USAGE:
 * const proxy = OrchestrationStartResponderProxy();
 * proxy.setupStart({ quest });
 * const processId = await proxy.callResponder({ questId: quest.id });
 * proxy.getPersistedQuestAt({ index: 0 }); // the relay seed's single atomic operations persist
 */

import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import { questContract } from '@dungeonmaster/shared/contracts';
import { GuildConfigStub } from '@dungeonmaster/shared/contracts/guild-config/guild-config.stub';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { guildGetBrokerProxy } from '../../../brokers/guild/get/guild-get-broker.proxy';
import { questBuildRelayGraphBrokerProxy } from '../../../brokers/quest/build-relay-graph/quest-build-relay-graph-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../../../brokers/quest/find-quest-path/quest-find-quest-path-broker.proxy';
import { questGetBrokerProxy } from '../../../brokers/quest/get/quest-get-broker.proxy';
import { questModifyBrokerProxy } from '../../../brokers/quest/modify/quest-modify-broker.proxy';
import { questOperationsUpdateBrokerProxy } from '../../../brokers/quest/operations-update/quest-operations-update-broker.proxy';
import { orchestrationProcessesStateProxy } from '../../../state/orchestration-processes/orchestration-processes-state.proxy';
import { questExecutionQueueStateProxy } from '../../../state/quest-execution-queue/quest-execution-queue-state.proxy';
import { OrchestrationStartResponder } from './orchestration-start-responder';
import { PrepareQuestPackageGraphLayerResponder } from './prepare-quest-package-graph-layer-responder';
import { PrepareQuestPackageGraphLayerResponderProxy } from './prepare-quest-package-graph-layer-responder.proxy';

type Quest = ReturnType<typeof QuestStub>;
type Parsed = ReturnType<typeof questContract.parse>;
type PackageGraph = Exclude<
  Awaited<ReturnType<typeof PrepareQuestPackageGraphLayerResponder>>,
  undefined
>;

// uuid consumption order per Start: call 1 is the processId, then questBuildRelayGraphBroker
// consumes one id per seeded implementation operation item, one per verify-tail item, and one for
// the single first work item. The test file mirrors this list (SEEDED_UUIDS) to build expected
// operation/work-item ids per quest type.
const SEEDED_UUIDS = [
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'aaaaaaaa-1111-4222-9333-444444444444',
  'bbbbbbbb-1111-4222-9333-444444444444',
  'cccccccc-1111-4222-9333-444444444444',
  'dddddddd-1111-4222-9333-444444444444',
  'eeeeeeee-1111-4222-9333-444444444444',
  'ffffffff-1111-4222-9333-444444444444',
  '11111111-1111-4222-9333-444444444444',
  '22222222-1111-4222-9333-444444444444',
  '33333333-1111-4222-9333-444444444444',
] as const;

export const OrchestrationStartResponderProxy = (): {
  callResponder: typeof OrchestrationStartResponder;
  setupQuestNotFound: () => void;
  setupQuestNotStartable: (params: { quest: Quest }) => void;
  setupStart: (params: { quest: Quest }) => void;
  setupStartSkipsOperationsPersist: (params: { quest: Quest }) => void;
  setupModifyFailure: (params: { quest: Quest }) => void;
  setupPackageGraphDerived: (params: { quest: Quest; packageGraph: PackageGraph }) => void;
  getPersistedStatuses: () => readonly Parsed['status'][];
  getPersistedQuestAt: (params: { index: number }) => Parsed;
} => {
  const getProxy = questGetBrokerProxy();
  // Runs REAL — its single atomic read-modify-write is fed by the ops fs round queued in
  // setupStart, and its captured quest.json writes back every getPersisted* inspector below
  // (the write mock is shared with questModifyBroker's persist, so the modify transition's
  // write lands in the same ordered list).
  const opsProxy = questOperationsUpdateBrokerProxy();
  const modifyProxy = questModifyBrokerProxy();
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  const relayProxy = questBuildRelayGraphBrokerProxy();
  relayProxy.setupUuids({ ids: SEEDED_UUIDS });
  const queueProxy = questExecutionQueueStateProxy();
  queueProxy.setupEmpty();
  const processesProxy = orchestrationProcessesStateProxy();
  processesProxy.setupEmpty();

  // PrepareQuestPackageGraphLayerResponder is mocked directly (see the header comment) rather than
  // composed for real: it issues one manifest read per declared package, and staging those here
  // would collide with this proxy's own quest.json read staging. Wired to satisfy
  // enforce-proxy-child-creation; the registerMock below replaces the responder entirely so this
  // child proxy's own fs mocks never fire. Each staged quest gets "nothing to stamp" — the shape for
  // a quest declaring no packages — so every existing test keeps its single atomic persist.
  PrepareQuestPackageGraphLayerResponderProxy();
  const packageGraphMock = registerMock({ fn: PrepareQuestPackageGraphLayerResponder });

  // The queue-entry guild lookup at the end of a successful Start: one more find-quest-path fs
  // round (for the guildId), then the guild-config read guildGetBroker performs.
  const setupPathResolution = ({ quest }: { quest: Quest }): void => {
    packageGraphMock.calledWith([{ quest: { id: quest.id } }]).resolves(undefined);
    const guildId = GuildIdStub();
    const homePath = '/home/testuser/.dungeonmaster';
    const guildsDir = '/home/testuser/.dungeonmaster/guilds';
    const questsDirPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;
    const questFolderPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`;
    const questFilePath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`;
    const guildPath = '/home/testuser/project';

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

    const guild = GuildStub({ id: guildId, path: guildPath });
    // Same home as findQuestPathProxy above — one real process has one home, and
    // dungeonmasterHomeFindBroker() is a single shared, address-less mock.
    guildProxy.setupConfig({
      config: GuildConfigStub({ guilds: [guild] }),
      homeDir: '/home/testuser',
      homePath,
    });
  };

  return {
    callResponder: OrchestrationStartResponder,

    setupQuestNotFound: (): void => {
      getProxy.setupEmptyFolder();
    },

    // Quest loads, the startable-status gate throws — nothing past questGetBroker runs.
    setupQuestNotStartable: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
    },

    // The full happy chain with ONE questOperationsUpdateBroker persist (fresh relay seed, or a
    // chat-item promotion under an existing relay). fs rounds queue in runtime order: the
    // questGetBroker load, the ops-update read-modify-write, the modify-quest status transition
    // (its mocked read sees the pre-transition file — the mocked fs does not replay prior
    // persists), then the guild lookup for the queue entry.
    setupStart: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      opsProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      setupPathResolution({ quest });
    },

    // Idempotent re-Start with nothing to promote: the ledger already carries the locked ward
    // tail and every chat item is terminal, so the responder never calls
    // questOperationsUpdateBroker — no ops fs round is queued.
    setupStartSkipsOperationsPersist: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      modifyProxy.setupQuestFound({ quest });
      setupPathResolution({ quest });
    },

    // The relay seed persists, then the approved -> in_progress modify resolves
    // { success: false } — the responder must surface it as a thrown start failure.
    setupModifyFailure: ({ quest }: { quest: Quest }): void => {
      getProxy.setupQuestFound({ quest });
      opsProxy.setupQuestFound({ quest });
      packageGraphMock.calledWith([{ quest: { id: quest.id } }]).resolves(undefined);
      modifyProxy.setupResolveFailureOnce();
    },

    // The quest declares packages and carries no graph yet, so the layer returns entries to stamp.
    setupPackageGraphDerived: ({
      quest,
      packageGraph,
    }: {
      quest: Quest;
      packageGraph: PackageGraph;
    }): void => {
      packageGraphMock.onceFor([{ quest: { id: quest.id } }]).resolves(packageGraph);
    },

    getPersistedStatuses: (): readonly Parsed['status'][] =>
      opsProxy.getAllPersistedQuests().map((persisted) => persisted.status),

    getPersistedQuestAt: ({ index }: { index: number }): Parsed => {
      const persisted = opsProxy.getAllPersistedQuests();
      return questContract.parse(persisted[index]);
    },
  };
};
