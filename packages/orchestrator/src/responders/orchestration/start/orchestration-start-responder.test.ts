import {
  GuildIdStub,
  OperationItemStub,
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

// Feature quests seed NO implementation ops at Start (Chaos authored the codeweaver items at spec
// time), so the verify tail consumes uuids 1..6 and the first work item consumes the next one.
const FEATURE_TAIL_EXPECTED = questTypeRegistryStatics.feature.relayTail.map((seed, index) => ({
  id: SEEDED_UUIDS[index + 1],
  role: seed.role,
  text: seed.text,
  status: 'pending',
  locked: true,
  ...('wardMode' in seed ? { wardMode: seed.wardMode } : {}),
}));
const FEATURE_WORK_ITEM_UUID = SEEDED_UUIDS[questTypeRegistryStatics.feature.relayTail.length + 1];

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
  })),
  ...questTypeRegistryStatics['bug-hunt'].relayTail.map((seed, index) => ({
    id: SEEDED_UUIDS[index + 1 + BUG_HUNT_IMPLEMENTATION_COUNT],
    role: seed.role,
    text: seed.text,
    status: 'pending',
    locked: true,
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

  describe('feature relay seed (one atomic operations persist)', () => {
    it('VALID: {approved feature quest with Chaos plan} => appends the locked verify tail in registry order and flips the first codeweaver op in_progress', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const chaosOp = OperationItemStub({
        id: CHAOS_OP_UUID,
        role: 'chaoswhisperer',
        text: 'Plan the quest',
        status: 'complete',
        locked: true,
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
      });
      const wardOp = OperationItemStub({
        id: WARD_OP_UUID,
        role: 'ward',
        text: 'Ward gate (changed files)',
        status: 'pending',
        locked: true,
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
      });
      const wardOp = OperationItemStub({
        id: WARD_OP_UUID,
        role: 'ward',
        text: 'Ward gate (changed files)',
        status: 'pending',
        locked: true,
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
      });
      const wardOp = OperationItemStub({
        id: WARD_OP_UUID,
        role: 'ward',
        text: 'Ward gate (changed files)',
        status: 'pending',
        locked: true,
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

    it('VALID: {approved bug-hunt quest, empty operations} => first work item is pesteater linked to the implementation op', async () => {
      const questId = QuestIdStub({ value: 'fix-bug' });
      const quest = QuestStub({ id: questId, status: 'approved', questType: 'bug-hunt' });
      const proxy = OrchestrationStartResponderProxy();
      proxy.setupStart({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getPersistedQuestAt({ index: 0 });

      expect(persisted.workItems).toStrictEqual([
        {
          id: BUG_HUNT_WORK_ITEM_UUID,
          role: 'pesteater',
          status: 'pending',
          spawnerType: 'agent',
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
