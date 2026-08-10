import {
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import { questStatusMetadataStatics } from '@dungeonmaster/shared/statics';

import { warpgateOperationStatics } from '../../../statics/warpgate-operation/warpgate-operation-statics';
import { OrchestrationMergeResponderProxy } from './orchestration-merge-responder.proxy';

type StatusKey = keyof typeof questStatusMetadataStatics.statuses;

const ALL_STATUSES = Object.keys(questStatusMetadataStatics.statuses) as readonly StatusKey[];
const NON_MERGEABLE_STATUSES = ALL_STATUSES.filter(
  (status) => !questStatusMetadataStatics.statuses[status].isMergeable,
);

// Mirrors the uuid queue seeded by OrchestrationMergeResponderProxy: the warpgate operation item's
// id, then the warpgate work item's id.
const WARPGATE_OPERATION_ID = 'eeeeeeee-1111-4222-9333-444444444444';
const WARPGATE_WORK_ITEM_ID = 'ffffffff-1111-4222-9333-444444444444';

// Every Date#toISOString is pinned by the composed persist proxies.
const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';

const expectedWarpgateOperation = (): ReturnType<typeof OperationItemStub> =>
  OperationItemStub({
    id: WARPGATE_OPERATION_ID,
    role: 'warpgate',
    text: warpgateOperationStatics.text,
    status: 'pending',
    locked: true,
    flowIds: [],
  });

const expectedWarpgateWorkItem = (): ReturnType<typeof WorkItemStub> =>
  WorkItemStub({
    id: QuestWorkItemIdStub({ value: WARPGATE_WORK_ITEM_ID }),
    role: 'warpgate',
    status: 'pending',
    spawnerType: 'agent',
    relatedDataItems: [`operations/${WARPGATE_OPERATION_ID}`],
    dependsOn: [],
    attempt: 0,
    maxAttempts: 1,
    retryCount: 0,
    createdAt: FIXED_TIMESTAMP,
  });

describe('OrchestrationMergeResponder', () => {
  describe('quest lookup + status gate', () => {
    it('ERROR: {questId not found} => throws quest not found error', async () => {
      const questId = QuestIdStub({ value: 'nonexistent' });
      const proxy = OrchestrationMergeResponderProxy();
      proxy.setupQuestNotFound();

      await expect(proxy.callResponder({ questId })).rejects.toThrow(
        'Quest not found: nonexistent',
      );
    });

    it.each(NON_MERGEABLE_STATUSES)(
      'INVALID: {status: %s} => throws and writes nothing',
      async (status) => {
        const questId = QuestIdStub({ value: 'add-auth' });
        const quest = QuestStub({ id: questId, status });
        const proxy = OrchestrationMergeResponderProxy();
        proxy.setupMerge({ quest });

        await expect(proxy.callResponder({ questId })).rejects.toThrow(
          `Quest must be blocked or complete to merge. Current status: ${status}`,
        );
        expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
      },
    );
  });

  describe('merge from complete', () => {
    it("VALID: {complete quest} => appends exactly one pending warpgate operation after the existing tail, mints its linked pending work item with empty dependsOn, and the persisted quest.json status is 'merging'", async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const existingOp = OperationItemStub({
        id: 'a1a1a1a1-58cc-4372-a567-0e02b2c3d479',
        role: 'ward',
        text: 'Ward gate (full)',
        status: 'complete',
        locked: true,
      });
      const quest = QuestStub({
        id: questId,
        status: 'complete',
        operations: [existingOp],
        workItems: [],
      });
      const proxy = OrchestrationMergeResponderProxy();
      proxy.setupMerge({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toStrictEqual({ merging: true });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted).toStrictEqual(
        QuestStub({
          id: questId,
          status: 'merging',
          operations: [existingOp, expectedWarpgateOperation()],
          workItems: [expectedWarpgateWorkItem()],
          updatedAt: FIXED_TIMESTAMP,
        }),
      );
    });
  });

  describe('merge from blocked', () => {
    it('VALID: {blocked quest with two still-pending operation items} => those items are marked complete and the warpgate operation is the only non-complete one left', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const opA = OperationItemStub({
        id: 'a1a1a1a1-58cc-4372-a567-0e02b2c3d479',
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'pending',
      });
      const opB = OperationItemStub({
        id: 'b2b2b2b2-58cc-4372-a567-0e02b2c3d479',
        role: 'ward',
        text: 'Ward gate (changed)',
        status: 'in_progress',
        locked: true,
        wardMode: 'changed',
      });
      const quest = QuestStub({
        id: questId,
        status: 'blocked',
        operations: [opA, opB],
        workItems: [],
      });
      const proxy = OrchestrationMergeResponderProxy();
      proxy.setupMerge({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted).toStrictEqual(
        QuestStub({
          id: questId,
          status: 'merging',
          operations: [
            { ...opA, status: 'complete' },
            { ...opB, status: 'complete' },
            expectedWarpgateOperation(),
          ],
          workItems: [expectedWarpgateWorkItem()],
          updatedAt: FIXED_TIMESTAMP,
        }),
      );
    });

    it("VALID: {blocked quest} => the persisted quest.json status is 'merging'", async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'blocked', operations: [], workItems: [] });
      const proxy = OrchestrationMergeResponderProxy();
      proxy.setupMerge({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getLastPersistedQuest();

      expect(persisted).toStrictEqual(
        QuestStub({
          id: questId,
          status: 'merging',
          operations: [expectedWarpgateOperation()],
          workItems: [expectedWarpgateWorkItem()],
          updatedAt: FIXED_TIMESTAMP,
        }),
      );
    });
  });

  // warpgate-merge:observable:warpgate-item-depends-on-nothing — "the minted warpgate work item's
  // `dependsOn` is empty rather than chained after the quest's most recent work item the way an
  // advanced relay item is." Every OTHER fixture in this file seeds `workItems: []`, so a prior
  // pass that chained `dependsOn` off `current.workItems[0]` stayed GREEN against them: with no
  // prior item, "chained after the last item" and "empty" are the same value ([] either way). This
  // fixture carries a PRIOR work item — a `skipped` one, the sharpest case the observable itself
  // names, since a `blocked` quest's trailing work items are `skipped` and `skipped` does NOT
  // satisfy `dependsOn` — so "empty" and "chained after the prior item" produce visibly different
  // persisted shapes and this test can actually tell them apart.
  describe('merge from blocked with a PRIOR (skipped) work item — dependsOn discriminator', () => {
    it("VALID: {blocked quest already carrying one skipped work item} => the minted warpgate work item's dependsOn is empty, NOT chained after the prior skipped item", async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const priorSkippedItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'codeweaver',
        status: 'skipped',
      });
      const quest = QuestStub({
        id: questId,
        status: 'blocked',
        operations: [],
        workItems: [priorSkippedItem],
      });
      const proxy = OrchestrationMergeResponderProxy();
      proxy.setupMerge({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getLastPersistedQuest();

      // FAILS IF the minted work item's dependsOn is chained onto priorSkippedItem.id instead of
      // left empty — the two fixtures above (workItems: []) cannot distinguish those two values,
      // this one can.
      expect(persisted).toStrictEqual(
        QuestStub({
          id: questId,
          status: 'merging',
          operations: [expectedWarpgateOperation()],
          workItems: [priorSkippedItem, expectedWarpgateWorkItem()],
          updatedAt: FIXED_TIMESTAMP,
        }),
      );
    });
  });

  describe('follow-up chat stopped before merge', () => {
    it('VALID: {quest carrying a tavernkeeper work item with a registered running process} => that process is killed before any quest write happens', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const tavernkeeperItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'tavernkeeper',
        status: 'in_progress',
      });
      const quest = QuestStub({ id: questId, status: 'blocked', workItems: [tavernkeeperItem] });
      const proxy = OrchestrationMergeResponderProxy();
      proxy.setupTavernkeeperProcessRunning({ workItemId: tavernkeeperItem.id });
      proxy.setupMerge({ quest });

      await proxy.callResponder({ questId });

      expect(proxy.wasFollowupProcessKilled()).toBe(true);
      expect(proxy.wasKilledBeforeAnyQuestWrite()).toBe(true);
    });

    it('VALID: {quest carrying a tavernkeeper work item with NO registered process} => appends the merge without throwing', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const tavernkeeperItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' }),
        role: 'tavernkeeper',
        status: 'complete',
      });
      const quest = QuestStub({ id: questId, status: 'blocked', workItems: [tavernkeeperItem] });
      const proxy = OrchestrationMergeResponderProxy();
      proxy.setupMerge({ quest });

      const result = await proxy.callResponder({ questId });

      expect(result).toStrictEqual({ merging: true });
      expect(proxy.wasFollowupProcessKilled()).toBe(false);
    });

    it('VALID: {quest with no tavernkeeper work item} => appends the merge and kills nothing', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'blocked', workItems: [] });
      const proxy = OrchestrationMergeResponderProxy();
      proxy.setupMerge({ quest });

      await proxy.callResponder({ questId });

      expect(proxy.wasFollowupProcessKilled()).toBe(false);
    });
  });

  describe('double-submit', () => {
    it('VALID: {quest already carrying a pending warpgate operation} => appends no second one', async () => {
      // Two clicks on Teleport with Booty are two POSTs. Both read the quest and pass the status
      // gate before either writes, so the append is the only place left that can refuse the
      // second one. questOperationsUpdateBroker re-reads the quest INSIDE its per-quest lock, so
      // the loser genuinely sees the winner's entry — this is that read.
      const questId = QuestIdStub({ value: 'add-auth' });
      const priorOperation = OperationItemStub({
        id: 'aaaaaaaa-1111-4222-9333-444444444444',
        role: 'warpgate',
        text: warpgateOperationStatics.text,
        status: 'pending',
        locked: true,
        flowIds: [],
      });
      const priorWorkItem = WorkItemStub({
        id: QuestWorkItemIdStub({ value: 'bbbbbbbb-1111-4222-9333-444444444444' }),
        role: 'warpgate',
        status: 'pending',
        spawnerType: 'agent',
        relatedDataItems: ['operations/aaaaaaaa-1111-4222-9333-444444444444'],
        dependsOn: [],
        maxAttempts: 1,
        createdAt: FIXED_TIMESTAMP,
      });
      const quest = QuestStub({
        id: questId,
        status: 'complete',
        operations: [priorOperation],
        workItems: [priorWorkItem],
      });
      const proxy = OrchestrationMergeResponderProxy();
      proxy.setupWarpgateAlreadyAppended({ quest });

      await proxy.callResponder({ questId });

      const persisted = proxy.getLastPersistedQuest();

      expect(
        persisted.operations.filter((operation) => operation.role === 'warpgate'),
      ).toStrictEqual([priorOperation]);
      expect(persisted.workItems.filter((workItem) => workItem.role === 'warpgate')).toStrictEqual([
        priorWorkItem,
      ]);
    });
  });

  describe('status transition failure', () => {
    it('ERROR: {status modify rejected} => throws and appends no operation', async () => {
      const questId = QuestIdStub({ value: 'add-auth' });
      const quest = QuestStub({ id: questId, status: 'complete' });
      const proxy = OrchestrationMergeResponderProxy();
      proxy.setupModifyFailure({ quest });

      await expect(proxy.callResponder({ questId })).rejects.toThrow(/Failed to start merge/u);
      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });
  });
});
