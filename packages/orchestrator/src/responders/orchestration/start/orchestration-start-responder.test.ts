import {
  AbsoluteFilePathStub,
  GuildIdStub,
  OperationItemStub,
  PackageGraphEntryStub,
  QuestBranchNameStub,
  QuestIdStub,
  QuestStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import {
  questStatusMetadataStatics,
  questTypeRegistryStatics,
} from '@dungeonmaster/shared/statics';

import { orchestrationProcessesState } from '../../../state/orchestration-processes/orchestration-processes-state';
import { questExecutionQueueState } from '../../../state/quest-execution-queue/quest-execution-queue-state';
import { OrchestrationStartResponderProxy } from './orchestration-start-responder.proxy';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const ALL_STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];
const STARTABLE_STATUSES = ALL_STATUSES.filter(
  (status) => questStatusMetadataStatics.statuses[status].isStartable,
);
const NON_STARTABLE_STATUSES = ALL_STATUSES.filter(
  (status) => !questStatusMetadataStatics.statuses[status].isStartable,
);
const STARTABLE_LIST = STARTABLE_STATUSES.join(' or ');

// Mirrors the uuid queue seeded by OrchestrationStartResponderProxy: index 0 is the processId;
// questBuildRelayGraphBroker consumes the rest in order — one id per seeded implementation
// operation item, one per verify-tail item, then one for the single first work item.
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

const PROCESS_ID = `proc-${SEEDED_UUIDS[0]}`;

// Every Date#toISOString is pinned by the composed persist/outbox proxies.
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';

// Feature quests seed implementation ops at Start as well: the ONE codeweaver seed carries
// `fanOutBy: 'implementation'`, so the derived per-cell ledger is minted here rather than authored
// at spec time. QuestStub declares one flow with no tagged nodes, no packagesAffected and no
// contracts, so there is no (package, flow) cell and no foundation package to derive — the fan-out
// falls back to ONE whole-quest item. Implementation items consume uuids first, then the verify
// tail, then the single first work item.
const QUEST_STUB_FLOW_ID = 'login-flow';
const FEATURE_IMPLEMENTATION_EXPECTED = questTypeRegistryStatics.feature.startImplementationOps.map(
  (seed, index) => ({
    id: SEEDED_UUIDS[index + 1],
    role: seed.role,
    text: seed.text,
    status: 'pending',
    // Read the same way the seed broker reads it: `locked` defaults TRUE and a seed opts out by
    // declaring it. Codeweaver is the one that does, so its pt chain stays unbounded — the flows are
    // the acceptance target, so the work has to land however many passes it takes. Riftcarver
    // declares nothing and therefore locks, which is what enrols it in its retry budget.
    locked: 'locked' in seed ? seed.locked : true,
    flowIds: [],
    packageNames: [],
  }),
);
const FEATURE_IMPLEMENTATION_COUNT = FEATURE_IMPLEMENTATION_EXPECTED.length;
// The verify tail's 1:1 mapping per surviving entry: flowrider falls back to ONE whole-quest item
// carrying every runtime flow id, siegemaster gets one item per flow (there is one), and
// groundstomper gets NONE — nothing on that flow lands in a package a browser can reach.
const FEATURE_TAIL_SEEDED = questTypeRegistryStatics.feature.relayTail.filter(
  (entry) => entry.role !== 'groundstomper',
);
const FEATURE_TAIL_EXPECTED = FEATURE_TAIL_SEEDED.map((entry, index) => ({
  id: SEEDED_UUIDS[index + 1 + FEATURE_IMPLEMENTATION_COUNT],
  role: entry.role,
  // Siegemaster fans out to one item per flow, each suffixed with the flow it owns. QuestStub
  // declares exactly one flow, so the tail keeps its 1:1 shape here and only the text differs.
  text: entry.role === 'siegemaster' ? `${entry.text} — flow: ${QUEST_STUB_FLOW_ID}` : entry.text,
  status: 'pending',
  locked: true,
  flowIds: entry.role === 'flowrider' || entry.role === 'siegemaster' ? [QUEST_STUB_FLOW_ID] : [],
  packageNames: [],
  ...('wardMode' in entry ? { wardMode: entry.wardMode } : {}),
}));
const FEATURE_WORK_ITEM_UUID =
  SEEDED_UUIDS[FEATURE_IMPLEMENTATION_COUNT + FEATURE_TAIL_EXPECTED.length + 1];

// Bug-hunt quests seed the registry's implementation ops first (uuids 1..N), then the tail. The
// first implementation op is the overall-first pending op, so the relay flips it in_progress.
const BUG_HUNT_IMPLEMENTATION_COUNT =
  questTypeRegistryStatics['bug-hunt'].startImplementationOps.length;
const BUG_HUNT_OPS_EXPECTED = [
  ...questTypeRegistryStatics['bug-hunt'].startImplementationOps.map((seed, index) => ({
    id: SEEDED_UUIDS[index + 1],
    role: seed.role,
    text: seed.text,
    status: index === 0 ? 'in_progress' : 'pending',
    locked: true,
    flowIds: [],
    packageNames: [],
  })),
  ...questTypeRegistryStatics['bug-hunt'].relayTail.map((seed, index) => ({
    id: SEEDED_UUIDS[index + 1 + BUG_HUNT_IMPLEMENTATION_COUNT],
    role: seed.role,
    text: seed.text,
    status: 'pending',
    locked: true,
    flowIds: [],
    packageNames: [],
    ...('wardMode' in seed ? { wardMode: seed.wardMode } : {}),
  })),
];
const BUG_HUNT_WORK_ITEM_UUID =
  SEEDED_UUIDS[
    BUG_HUNT_IMPLEMENTATION_COUNT + questTypeRegistryStatics['bug-hunt'].relayTail.length + 1
  ];

const CHAT_ITEM_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const CHAOS_OP_UUID = 'c0c0c0c0-58cc-4372-a567-0e02b2c3d479';
const CW_OP_ONE_UUID = 'c1c1c1c1-58cc-4372-a567-0e02b2c3d479';
const CW_OP_TWO_UUID = 'c2c2c2c2-58cc-4372-a567-0e02b2c3d479';
const WARD_OP_UUID = 'dddd0000-58cc-4372-a567-0e02b2c3d479';

// The git context an already-carved quest carries. The idempotency describe block below models a
// quest a previous Start already seeded and a previous riftcarver already carved, so its quest.json
// holds both — Start reads neither and writes neither.
const EXISTING_BRANCH_NAME = QuestBranchNameStub({ value: 'quest/add-auth-f47ac10b' });
const EXISTING_WORKTREE_PATH = AbsoluteFilePathStub({
  value: '/repo/worktrees/add-auth-f47ac10b',
});

// The riftcarver seed's text, restated from questTypeRegistryStatics (whose colocated test pins the
// exact wording) so the regression assertion below reads as one literal object.
const RIFTCARVER_TEXT = 'Riftcarver: carve the quest branch, worktree and preflight build';

const DERIVED_PACKAGE_GRAPH = [
  PackageGraphEntryStub({
    id: 'shared',
    dependsOn: [],
    depth: 0,
    packageType: 'library',
    changeType: 'edit',
  }),
  PackageGraphEntryStub({
    id: 'server',
    dependsOn: ['shared'],
    depth: 1,
    packageType: 'http-backend',
    changeType: 'edit',
  }),
];

describe('OrchestrationStartResponder', () => {
  describe('quest lookup + startable gate', () => {
    it('ERROR: {questId not found} => throws quest not found error', async () => {
      const questId = QuestIdStub({ value: 'nonexistent' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupQuestNotFound();

      await expect(proxy.callResponder({ questId })).rejects.toThrow(
        'Quest not found: nonexistent',
      );
    });

    it.each(NON_STARTABLE_STATUSES)(
      'ERROR: {status: %s} => throws startable-status error naming the startable statuses',
      async (status) => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const quest = QuestStub({ id: questId, status });
        const proxy = OrchestrationStartResponderProxy();
        proxy.setupQuestNotStartable({ quest });

        await expect(proxy.callResponder({ questId })).rejects.toThrow(
          `Quest must be in a startable status (${STARTABLE_LIST}). Current status: ${status}`,
        );
      },
    );

    it.each(STARTABLE_STATUSES)(
      'VALID: {status: %s} => returns the seeded processId',
      async (status) => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const quest = QuestStub({ id: questId, status });
        const proxy = OrchestrationStartResponderProxy();
        proxy.setupStart({ quest });

        const result = await proxy.callResponder({ questId });

        expect(result).toBe(PROCESS_ID);
      },
    );

    it.each(STARTABLE_STATUSES)(
      'VALID: {status: %s} => persists the relay seed at %s then transitions to in_progress',
      async (status) => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const quest = QuestStub({ id: questId, status });
        const proxy = OrchestrationStartResponderProxy();
        proxy.setupStart({ quest });

        await proxy.callResponder({ questId });

        expect(proxy.getPersistedStatuses()).toStrictEqual([status, 'in_progress']);
      },
    );
  });

  // The defect this block exists for: Begin Quest used to sit pending for minutes because the POST
  // ran `git worktree add`, mirrored node_modules and built the tree before it persisted anything,
  // so the WS `quest-modified` event that swaps the panel could not fire until all of it finished.
  // Every one of those steps is the riftcarver operation item this seeds at the head of the relay,
  // and the two assertions below are what would have caught the defect: nothing is spawned, and the
  // work that used to be spawned is on the ledger instead.
  describe('Start is a pure ledger transition — it spawns nothing and touches no git', () => {
    it('VALID: {approved feature quest} => spawns ZERO child processes: no git, no npm, nothing', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      expect(proxy.getSpawnedCommands()).toStrictEqual([]);
    });

    it('VALID: {approved feature quest, empty ledger} => the seeded relay OPENS with the riftcarver operation item, already in_progress', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect(persisted.operations[0]).toStrictEqual({
        id: SEEDED_UUIDS[1],
        role: 'riftcarver',
        text: RIFTCARVER_TEXT,
        status: 'in_progress',
        locked: true,
        flowIds: [],
        packageNames: [],
      });
    });

    it('VALID: {approved feature quest, empty ledger} => the ONE seeded work item is the riftcarver command linked to that operation item', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      // `spawnerType: 'command'` is the load-bearing field: it routes this item to the dispatcher's
      // own run path (questRunRiftcarverBroker), which is what streams the carve into the execution
      // row instead of leaving the panel to render nothing while a POST blocks.
      expect(persisted.workItems).toStrictEqual([
        {
          id: FEATURE_WORK_ITEM_UUID,
          role: 'riftcarver',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: [`operations/${SEEDED_UUIDS[1]}`],
          dependsOn: [],
          attempt: 0,
          maxAttempts: 1,
          retryCount: 0,
          createdAt: FIXED_TIMESTAMP,
        },
      ]);
    });

    it('VALID: {approved feature quest} => quest.json carries no branchName, baseBranch, worktreePath or baseRef after Start', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect({
        branchName: persisted.branchName,
        baseBranch: persisted.baseBranch,
        worktreePath: persisted.worktreePath,
        baseRef: persisted.baseRef,
      }).toStrictEqual({
        branchName: undefined,
        baseBranch: undefined,
        worktreePath: undefined,
        baseRef: undefined,
      });
    });
  });

  describe('package graph stamping', () => {
    it('VALID: {PrepareQuestPackageGraphLayerResponder resolves entries} => they land on the same atomic persist as the seeded relay, before the status flip', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });
      proxy.setupPackageGraphDerived({ packageGraph: DERIVED_PACKAGE_GRAPH });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect({ status: persisted.status, packageGraph: persisted.packageGraph }).toStrictEqual({
        status: 'approved',
        packageGraph: DERIVED_PACKAGE_GRAPH,
      });
    });

    it('VALID: {quest already carrying a packageGraph, so the layer derives nothing} => the stamped graph survives the Start untouched', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        packageGraph: DERIVED_PACKAGE_GRAPH,
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect(persisted.packageGraph).toStrictEqual(DERIVED_PACKAGE_GRAPH);
    });

    it('VALID: {prior tail seeded, no packageGraph recorded} => the promotion-only persist still records the derived graph', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const wardOp = OperationItemStub({
        id: WARD_OP_UUID,
        role: 'ward',
        text: 'Ward gate (changed files)',
        status: 'pending',
        locked: true,
        flowIds: [],
        wardMode: 'changed',
      });
      const chatItem = WorkItemStub({
        id: CHAT_ITEM_UUID,
        role: 'chaoswhisperer',
        status: 'complete',
        completedAt: FIXED_TIMESTAMP,
      });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        operations: [wardOp],
        workItems: [chatItem],
        branchName: EXISTING_BRANCH_NAME,
        worktreePath: EXISTING_WORKTREE_PATH,
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });
      proxy.setupPackageGraphDerived({ packageGraph: DERIVED_PACKAGE_GRAPH });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect({
        operations: persisted.operations,
        packageGraph: persisted.packageGraph,
      }).toStrictEqual({ operations: [wardOp], packageGraph: DERIVED_PACKAGE_GRAPH });
    });
  });

  describe('feature relay seed (one atomic operations persist)', () => {
    it('VALID: {approved feature quest with Chaos plan} => appends the locked verify tail in registry order and flips the first codeweaver op in_progress', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosOp = OperationItemStub({
        id: CHAOS_OP_UUID,
        role: 'chaoswhisperer',
        text: 'Plan the quest',
        status: 'complete',
        locked: true,
        flowIds: [],
      });
      const cwOpOne = OperationItemStub({
        id: CW_OP_ONE_UUID,
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'pending',
      });
      const cwOpTwo = OperationItemStub({
        id: CW_OP_TWO_UUID,
        role: 'codeweaver',
        text: 'web: settings widget',
        status: 'pending',
      });
      const chatItem = WorkItemStub({
        id: CHAT_ITEM_UUID,
        role: 'chaoswhisperer',
        status: 'complete',
        completedAt: FIXED_TIMESTAMP,
      });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        operations: [chaosOp, cwOpOne, cwOpTwo],
        workItems: [chatItem],
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect(persisted.operations).toStrictEqual([
        chaosOp,
        { ...cwOpOne, status: 'in_progress' },
        cwOpTwo,
        ...FEATURE_IMPLEMENTATION_EXPECTED,
        ...FEATURE_TAIL_EXPECTED,
      ]);
    });

    it('VALID: {approved feature quest with Chaos plan} => links ONE new work item to the flipped op with dependsOn = chat item ids', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosOp = OperationItemStub({
        id: CHAOS_OP_UUID,
        role: 'chaoswhisperer',
        text: 'Plan the quest',
        status: 'complete',
        locked: true,
        flowIds: [],
      });
      const cwOpOne = OperationItemStub({
        id: CW_OP_ONE_UUID,
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'pending',
      });
      const chatItem = WorkItemStub({
        id: CHAT_ITEM_UUID,
        role: 'chaoswhisperer',
        status: 'complete',
        completedAt: FIXED_TIMESTAMP,
      });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        operations: [chaosOp, cwOpOne],
        workItems: [chatItem],
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect(persisted.workItems).toStrictEqual([
        chatItem,
        {
          id: FEATURE_WORK_ITEM_UUID,
          role: 'codeweaver',
          status: 'pending',
          spawnerType: 'agent',
          relatedDataItems: [`operations/${CW_OP_ONE_UUID}`],
          dependsOn: [CHAT_ITEM_UUID],
          attempt: 0,
          maxAttempts: 1,
          retryCount: 0,
          createdAt: FIXED_TIMESTAMP,
        },
      ]);
    });

    it('VALID: {approved feature quest with Chaos plan} => persists exactly twice: the atomic operations write (still approved) then the in_progress transition', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        operations: [
          OperationItemStub({
            id: CW_OP_ONE_UUID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'pending',
          }),
        ],
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      expect(proxy.getPersistedStatuses()).toStrictEqual(['approved', 'in_progress']);
    });
  });

  describe('chat work item promotion', () => {
    it('VALID: {pending chaoswhisperer work item} => promoted to complete in the same operations persist', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chatItem = WorkItemStub({
        id: CHAT_ITEM_UUID,
        role: 'chaoswhisperer',
        status: 'pending',
      });
      const quest = QuestStub({ id: questId, status: 'approved', workItems: [chatItem] });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect(persisted.workItems[0]).toStrictEqual({
        ...chatItem,
        status: 'complete',
        completedAt: FIXED_TIMESTAMP,
      });
    });

    it('VALID: {pending glyphsmith work item} => promoted to complete in the same operations persist', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const glyphItem = WorkItemStub({
        id: CHAT_ITEM_UUID,
        role: 'glyphsmith',
        status: 'pending',
      });
      const quest = QuestStub({ id: questId, status: 'approved', workItems: [glyphItem] });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect(persisted.workItems[0]).toStrictEqual({
        ...glyphItem,
        status: 'complete',
        completedAt: FIXED_TIMESTAMP,
      });
    });

    it('VALID: {failed chaoswhisperer work item} => already terminal, left untouched', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const failedChat = WorkItemStub({
        id: CHAT_ITEM_UUID,
        role: 'chaoswhisperer',
        status: 'failed',
      });
      const quest = QuestStub({ id: questId, status: 'approved', workItems: [failedChat] });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect(persisted.workItems[0]).toStrictEqual(failedChat);
    });
  });

  describe('chaoswhisperer plan operation settlement', () => {
    it('VALID: {non-complete chaoswhisperer plan op} => forced complete in the persisted ledger', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosOp = OperationItemStub({
        id: CHAOS_OP_UUID,
        role: 'chaoswhisperer',
        text: 'Plan the quest',
        status: 'pending',
        locked: true,
        flowIds: [],
      });
      const cwOp = OperationItemStub({
        id: CW_OP_ONE_UUID,
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'pending',
      });
      const quest = QuestStub({ id: questId, status: 'approved', operations: [chaosOp, cwOp] });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect(persisted.operations).toStrictEqual([
        { ...chaosOp, status: 'complete' },
        { ...cwOp, status: 'in_progress' },
        ...FEATURE_IMPLEMENTATION_EXPECTED,
        ...FEATURE_TAIL_EXPECTED,
      ]);
    });
  });

  describe('idempotency (locked ward tail already on the ledger)', () => {
    it('VALID: {prior tail + terminal chat item} => NO second tail; the only persist is the in_progress transition', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosOp = OperationItemStub({
        id: CHAOS_OP_UUID,
        role: 'chaoswhisperer',
        text: 'Plan the quest',
        status: 'complete',
        locked: true,
        flowIds: [],
      });
      const wardOp = OperationItemStub({
        id: WARD_OP_UUID,
        role: 'ward',
        text: 'Ward gate (changed files)',
        status: 'pending',
        locked: true,
        flowIds: [],
        wardMode: 'changed',
      });
      const chatItem = WorkItemStub({
        id: CHAT_ITEM_UUID,
        role: 'chaoswhisperer',
        status: 'complete',
        completedAt: FIXED_TIMESTAMP,
      });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        operations: [chaosOp, wardOp],
        workItems: [chatItem],
        branchName: EXISTING_BRANCH_NAME,
        worktreePath: EXISTING_WORKTREE_PATH,
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStartSkipsOperationsPersist({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect(proxy.getPersistedStatuses()).toStrictEqual(['in_progress']);
      expect(persisted.operations).toStrictEqual([chaosOp, wardOp]);
    });

    it('VALID: {prior tail + pending chat item} => promotion-only persist keeps operations unchanged (no second tail)', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosOp = OperationItemStub({
        id: CHAOS_OP_UUID,
        role: 'chaoswhisperer',
        text: 'Plan the quest',
        status: 'complete',
        locked: true,
        flowIds: [],
      });
      const wardOp = OperationItemStub({
        id: WARD_OP_UUID,
        role: 'ward',
        text: 'Ward gate (changed files)',
        status: 'pending',
        locked: true,
        flowIds: [],
        wardMode: 'changed',
      });
      const chatItem = WorkItemStub({
        id: CHAT_ITEM_UUID,
        role: 'chaoswhisperer',
        status: 'pending',
      });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        operations: [chaosOp, wardOp],
        workItems: [chatItem],
        branchName: EXISTING_BRANCH_NAME,
        worktreePath: EXISTING_WORKTREE_PATH,
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect(persisted.operations).toStrictEqual([chaosOp, wardOp]);
    });

    it('VALID: {prior tail + pending chat item} => promotion-only persist marks the chat item complete', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosOp = OperationItemStub({
        id: CHAOS_OP_UUID,
        role: 'chaoswhisperer',
        text: 'Plan the quest',
        status: 'complete',
        locked: true,
        flowIds: [],
      });
      const wardOp = OperationItemStub({
        id: WARD_OP_UUID,
        role: 'ward',
        text: 'Ward gate (changed files)',
        status: 'pending',
        locked: true,
        flowIds: [],
        wardMode: 'changed',
      });
      const chatItem = WorkItemStub({
        id: CHAT_ITEM_UUID,
        role: 'chaoswhisperer',
        status: 'pending',
      });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        operations: [chaosOp, wardOp],
        workItems: [chatItem],
        branchName: EXISTING_BRANCH_NAME,
        worktreePath: EXISTING_WORKTREE_PATH,
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect(persisted.workItems).toStrictEqual([
        { ...chatItem, status: 'complete', completedAt: FIXED_TIMESTAMP },
      ]);
    });
  });

  describe('bug-hunt relay seed', () => {
    it('VALID: {approved bug-hunt quest, empty operations} => seeds the pesteater implementation op (in_progress) plus the 4-item locked verify tail', async () => {
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({ id: questId, status: 'approved', questType: 'bug-hunt' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect(persisted.operations).toStrictEqual(BUG_HUNT_OPS_EXPECTED);
    });

    // Riftcarver heads `startImplementationOps` for EVERY quest type, so the first work item a
    // bug-hunt Start mints is the workspace-preparation command, not pesteater — the branch, the
    // worktree and the preflight build have to exist before any agent is dispatched into them.
    // `spawnerType: 'command'` is the assertion that matters here: it is what routes this item to
    // the dispatcher's own run path instead of a Claude spawn.
    it('VALID: {approved bug-hunt quest, empty operations} => first work item is the riftcarver command linked to the implementation op', async () => {
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({ id: questId, status: 'approved', questType: 'bug-hunt' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect(persisted.workItems).toStrictEqual([
        {
          id: BUG_HUNT_WORK_ITEM_UUID,
          role: 'riftcarver',
          status: 'pending',
          spawnerType: 'command',
          relatedDataItems: [`operations/${SEEDED_UUIDS[1]}`],
          dependsOn: [],
          attempt: 0,
          maxAttempts: 1,
          retryCount: 0,
          createdAt: FIXED_TIMESTAMP,
        },
      ]);
    });

    it('VALID: {approved bug-hunt quest, empty operations} => persists the relay seed then transitions to in_progress', async () => {
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({ id: questId, status: 'approved', questType: 'bug-hunt' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      expect(proxy.getPersistedStatuses()).toStrictEqual(['approved', 'in_progress']);
    });
  });

  describe('status transition gate', () => {
    it('ERROR: {modify to in_progress fails} => throws start failure', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupModifyFailure({ quest });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/Failed to start quest/u);
    });
  });

  describe('queue + process registration', () => {
    it('VALID: {approved quest without questSource} => enqueues one complete queue entry snapshotting the pre-transition status', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved', title: 'Add Authentication' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      expect(questExecutionQueueState.getAll()).toStrictEqual([
        {
          questId,
          guildId: GuildIdStub(),
          guildSlug: 'my-guild',
          questTitle: 'Add Authentication',
          status: 'approved',
          enqueuedAt: FIXED_TIMESTAMP,
        },
      ]);
    });

    it('VALID: {approved quest with questSource} => queue entry carries the questSource', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({
        id: questId,
        status: 'approved',
        title: 'Add Authentication',
        questSource: 'user',
      });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      expect(questExecutionQueueState.getAll()).toStrictEqual([
        {
          questId,
          guildId: GuildIdStub(),
          guildSlug: 'my-guild',
          questTitle: 'Add Authentication',
          status: 'approved',
          questSource: 'user',
          enqueuedAt: FIXED_TIMESTAMP,
        },
      ]);
    });

    it('VALID: {registered placeholder process killed after start (pause path)} => queue entry SURVIVES', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'approved' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      const processId = await proxy.callResponder({ questId });
      // questPauseBroker kills the quest's registered process on pause — that kill must NOT
      // dequeue the entry, or a paused quest silently vanishes from the queue.
      orchestrationProcessesState.kill({ processId });

      expect(questExecutionQueueState.getAll().map((entry) => entry.questId)).toStrictEqual([
        questId,
      ]);
    });
  });
});
