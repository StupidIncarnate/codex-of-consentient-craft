import {
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { blightwardenMinionRolesStatics } from '../../../statics/blightwarden-minion-roles/blightwarden-minion-roles-statics';
import { slotManagerStatics } from '../../../statics/slot-manager/slot-manager-statics';
import { QuestHandleSignalBackResponder } from './quest-handle-signal-back-responder';
import { QuestHandleSignalBackResponderProxy } from './quest-handle-signal-back-responder.proxy';

const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';
const ITEM_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const PENDING_ITEM_ID = 'b2c3d4e5-f6a7-4b9c-8d1e-2f3a4b5c6d7e';
const OP1_ID = '11111111-1111-4111-8111-111111111111';
const OP2_ID = '22222222-2222-4222-8222-222222222222';
const OP3_ID = '33333333-3333-4333-8333-333333333333';
const CONTINUATION_UUID = 'c1c2c3c4-d5d6-4e7f-8a9b-0c1d2e3f4a5b';
const ADVANCE_UUID = '99999999-9999-4999-8999-999999999999';

type SlotManagerRole = keyof typeof slotManagerStatics;
type PtBudgetRole = Exclude<SlotManagerRole, 'ward' | 'orphanRecovery'>;

// Locked verify-tail roles whose pt chain is bounded by slotManagerStatics.<role>.maxAttempts —
// derived from the statics so a newly budgeted role is swept into the block matrix automatically.
const PT_BUDGET_ROLES = (Object.keys(slotManagerStatics) as readonly SlotManagerRole[]).filter(
  (role): role is PtBudgetRole => 'maxAttempts' in slotManagerStatics[role],
);

// Roles the responder exempts from any pt budget: the chat/command roles it special-cases plus
// every Blightwarden minion (isBlightwardenMinionRoleGuard) — locked items of these roles keep
// duplicating on partial no matter how long the chain already is.
const UNBOUNDED_PT_ROLES = [
  'chaoswhisperer',
  'glyphsmith',
  'ward',
  ...blightwardenMinionRolesStatics.roles,
] as const;

describe('QuestHandleSignalBackResponder', () => {
  describe('quest load failures surface (never silently drop the signal)', () => {
    it('ERROR: {quest unreadable} => throws naming the quest, signal, and work item', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      proxy.setupQuestUnreadable();
      const questId = QuestIdStub({ value: 'add-auth' });
      const workItemId = QuestWorkItemIdStub({ value: ITEM_ID });

      await expect(
        QuestHandleSignalBackResponder({ questId, workItemId, signal: 'complete' }),
      ).rejects.toThrow(
        /signal-back could not load quest add-auth to apply 'complete' to work item a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d/u,
      );
    });
  });

  describe('idempotent no-ops', () => {
    it('EDGE: {work item not on quest} => success without any persist', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const quest = QuestStub({
        operations: [OperationItemStub({ id: OP1_ID, status: 'in_progress' })],
        workItems: [],
      });
      proxy.setupQuest({ quest });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: QuestWorkItemIdStub({ value: ITEM_ID }),
        signal: 'complete',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });

    it("EDGE: {work item already terminal, redelivered 'partial'} => success, no second pt continuation and zero persists", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'complete',
          }),
          OperationItemStub({
            id: OP2_ID,
            role: 'codeweaver',
            text: 'pt 2: core: config adapter',
            status: 'pending',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
      });
      proxy.setupQuest({ quest });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });

    it("EDGE: {linked operation already complete, work item still active, 'partial'} => terminalizes the item in one persist, operations untouched (no continuation)", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const completedOp = OperationItemStub({
        id: OP1_ID,
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'complete',
      });
      const quest = QuestStub({
        operations: [completedOp],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        operations: [completedOp],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });
  });

  describe("operationStatus 'done' (or absent) — one atomic persist, then advance", () => {
    it("VALID: {operationStatus: 'done', next op pending} => single persist completes item+operation, advance creates the next work item", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const op2Pending = OperationItemStub({
        id: OP2_ID,
        role: 'lawbringer',
        text: 'review: core pairs',
        status: 'pending',
      });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'in_progress',
          }),
          op2Pending,
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const completedItem = WorkItemStub({
        id: itemId,
        role: 'codeweaver',
        status: 'complete',
        relatedDataItems: [`operations/${OP1_ID}`],
        completedAt: FIXED_TIMESTAMP,
        actualSignal: 'complete',
      });
      const op1Complete = OperationItemStub({
        id: OP1_ID,
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'complete',
      });
      const questAfterOutcome = QuestStub({
        operations: [op1Complete, op2Pending],
        workItems: [completedItem],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupAdvanceUuids({ ids: [ADVANCE_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([
        questAfterOutcome,
        QuestStub({
          operations: [
            op1Complete,
            OperationItemStub({
              id: OP2_ID,
              role: 'lawbringer',
              text: 'review: core pairs',
              status: 'in_progress',
            }),
          ],
          workItems: [
            completedItem,
            WorkItemStub({
              id: ADVANCE_UUID,
              role: 'lawbringer',
              status: 'pending',
              spawnerType: 'agent',
              relatedDataItems: [`operations/${OP2_ID}`],
              dependsOn: [itemId],
              createdAt: FIXED_TIMESTAMP,
            }),
          ],
          updatedAt: FIXED_TIMESTAMP,
        }),
      ]);
    });

    it('VALID: {operationStatus absent, last op} => operation completed in the same persist, ledger drained derives quest complete', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'blightwarden',
            text: 'audit: whole diff',
            status: 'in_progress',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'blightwarden',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'blightwarden',
            text: 'audit: whole diff',
            status: 'complete',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'blightwarden',
            status: 'complete',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });
  });

  describe("operationStatus 'partial' — pt continuation duplicated after the completed item", () => {
    it("VALID: {unlocked codeweaver, first 'partial'} => same persist appends 'pt 2: <base>' and advance creates the continuation's work item", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'in_progress',
            locked: false,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const completedItem = WorkItemStub({
        id: itemId,
        role: 'codeweaver',
        status: 'complete',
        relatedDataItems: [`operations/${OP1_ID}`],
        completedAt: FIXED_TIMESTAMP,
        actualSignal: 'complete',
      });
      const op1Complete = OperationItemStub({
        id: OP1_ID,
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'complete',
        locked: false,
      });
      const continuation = OperationItemStub({
        id: CONTINUATION_UUID,
        role: 'codeweaver',
        text: 'pt 2: core: config adapter',
        status: 'pending',
        locked: false,
      });
      const questAfterOutcome = QuestStub({
        operations: [op1Complete, continuation],
        workItems: [completedItem],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupContinuationUuids({ ids: [CONTINUATION_UUID] });
      proxy.setupAdvanceUuids({ ids: [ADVANCE_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([
        questAfterOutcome,
        QuestStub({
          operations: [
            op1Complete,
            OperationItemStub({
              id: CONTINUATION_UUID,
              role: 'codeweaver',
              text: 'pt 2: core: config adapter',
              status: 'in_progress',
              locked: false,
            }),
          ],
          workItems: [
            completedItem,
            WorkItemStub({
              id: ADVANCE_UUID,
              role: 'codeweaver',
              status: 'pending',
              spawnerType: 'agent',
              relatedDataItems: [`operations/${CONTINUATION_UUID}`],
              dependsOn: [itemId],
              createdAt: FIXED_TIMESTAMP,
            }),
          ],
          updatedAt: FIXED_TIMESTAMP,
        }),
      ]);
    });

    it("VALID: {'partial' on a 'pt 2: <base>' item} => continuation is 'pt 3: <base>' inserted right after it", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const original = OperationItemStub({
        id: OP1_ID,
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'complete',
      });
      const quest = QuestStub({
        operations: [
          original,
          OperationItemStub({
            id: OP2_ID,
            role: 'codeweaver',
            text: 'pt 2: core: config adapter',
            status: 'in_progress',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP2_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        operations: [
          original,
          OperationItemStub({
            id: OP2_ID,
            role: 'codeweaver',
            text: 'pt 2: core: config adapter',
            status: 'complete',
          }),
          OperationItemStub({
            id: CONTINUATION_UUID,
            role: 'codeweaver',
            text: 'pt 3: core: config adapter',
            status: 'pending',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [`operations/${OP2_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupContinuationUuids({ ids: [CONTINUATION_UUID] });

      await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);
    });

    it("VALID: {locked ward item with wardMode: 'changed'} => continuation preserves locked AND wardMode", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'ward',
            text: 'Ward gate (changed files)',
            status: 'in_progress',
            locked: true,
            wardMode: 'changed',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'ward',
            status: 'in_progress',
            spawnerType: 'command',
            relatedDataItems: [`operations/${OP1_ID}`],
            wardMode: 'changed',
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'ward',
            text: 'Ward gate (changed files)',
            status: 'complete',
            locked: true,
            wardMode: 'changed',
          }),
          OperationItemStub({
            id: CONTINUATION_UUID,
            role: 'ward',
            text: 'pt 2: Ward gate (changed files)',
            status: 'pending',
            locked: true,
            wardMode: 'changed',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'ward',
            status: 'complete',
            spawnerType: 'command',
            relatedDataItems: [`operations/${OP1_ID}`],
            wardMode: 'changed',
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupContinuationUuids({ ids: [CONTINUATION_UUID] });

      await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);
    });

    it("VALID: {UNLOCKED codeweaver at chainLength >= maxAttempts} => continuation still appended ('pt 4'), the budget applies to locked items only", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      // Chain of slotManagerStatics.codeweaver.maxAttempts (3) same-base items, none locked.
      const chainOriginal = OperationItemStub({
        id: OP1_ID,
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'complete',
        locked: false,
      });
      const chainPt2 = OperationItemStub({
        id: OP2_ID,
        role: 'codeweaver',
        text: 'pt 2: core: config adapter',
        status: 'complete',
        locked: false,
      });
      const chainPt3 = OperationItemStub({
        id: OP3_ID,
        role: 'codeweaver',
        text: 'pt 3: core: config adapter',
        status: 'in_progress',
        locked: false,
      });
      const quest = QuestStub({
        operations: [chainOriginal, chainPt2, chainPt3],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP3_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        operations: [
          chainOriginal,
          chainPt2,
          OperationItemStub({
            id: OP3_ID,
            role: 'codeweaver',
            text: 'pt 3: core: config adapter',
            status: 'complete',
            locked: false,
          }),
          OperationItemStub({
            id: CONTINUATION_UUID,
            role: 'codeweaver',
            text: 'pt 4: core: config adapter',
            status: 'pending',
            locked: false,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [`operations/${OP3_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupContinuationUuids({ ids: [CONTINUATION_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);
    });

    it.each(UNBOUNDED_PT_ROLES)(
      "VALID: {role: %s, LOCKED chain of 3, 'partial'} => budget-exempt role still appends 'pt 4'",
      async (role) => {
        const proxy = QuestHandleSignalBackResponderProxy();
        const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
        const chainOriginal = OperationItemStub({
          id: OP1_ID,
          role,
          text: 'verify: quest flows',
          status: 'complete',
          locked: true,
        });
        const chainPt2 = OperationItemStub({
          id: OP2_ID,
          role,
          text: 'pt 2: verify: quest flows',
          status: 'complete',
          locked: true,
        });
        const chainPt3 = OperationItemStub({
          id: OP3_ID,
          role,
          text: 'pt 3: verify: quest flows',
          status: 'in_progress',
          locked: true,
        });
        const quest = QuestStub({
          operations: [chainOriginal, chainPt2, chainPt3],
          workItems: [
            WorkItemStub({
              id: itemId,
              role,
              status: 'in_progress',
              relatedDataItems: [`operations/${OP3_ID}`],
            }),
          ],
        });
        const questAfterOutcome = QuestStub({
          operations: [
            chainOriginal,
            chainPt2,
            OperationItemStub({
              id: OP3_ID,
              role,
              text: 'pt 3: verify: quest flows',
              status: 'complete',
              locked: true,
            }),
            OperationItemStub({
              id: CONTINUATION_UUID,
              role,
              text: 'pt 4: verify: quest flows',
              status: 'pending',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role,
              status: 'complete',
              relatedDataItems: [`operations/${OP3_ID}`],
              completedAt: FIXED_TIMESTAMP,
              actualSignal: 'complete',
            }),
          ],
          updatedAt: FIXED_TIMESTAMP,
        });
        proxy.setupSignalFlow({ quest, questAfterOutcome });
        proxy.setupContinuationUuids({ ids: [CONTINUATION_UUID] });

        const result = await QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'partial',
        });

        expect(result).toStrictEqual({ success: true });
        expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);
      },
    );
  });

  describe('explicit operationItemId parameter', () => {
    it("VALID: {operationItemId set, work item linked to a different op} => the explicit id wins; the work item's own ref stays untouched", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const linkedOp = OperationItemStub({
        id: OP1_ID,
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'in_progress',
      });
      const quest = QuestStub({
        operations: [
          linkedOp,
          OperationItemStub({
            id: OP2_ID,
            role: 'siegemaster',
            text: 'qa: login flow',
            status: 'in_progress',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'siegemaster',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        operations: [
          linkedOp,
          OperationItemStub({
            id: OP2_ID,
            role: 'siegemaster',
            text: 'qa: login flow',
            status: 'complete',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'siegemaster',
            status: 'complete',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationItemId: OperationItemIdStub({ value: OP2_ID }),
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });
  });

  describe('work item without an operations ref', () => {
    it('EDGE: {relatedDataItems: []} => just terminalizes the work item, still success', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        operations: [],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'chaoswhisperer',
            status: 'in_progress',
            relatedDataItems: [],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        operations: [],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'chaoswhisperer',
            status: 'complete',
            relatedDataItems: [],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });
  });

  describe('locked pt-chain budget spent — quest blocks instead of appending', () => {
    it.each(PT_BUDGET_ROLES)(
      "VALID: {role: %s, LOCKED chain at maxAttempts, 'partial'} => no continuation, quest blocked and pending items skipped",
      async (role) => {
        const proxy = QuestHandleSignalBackResponderProxy();
        const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
        const pendingId = QuestWorkItemIdStub({ value: PENDING_ITEM_ID });
        // Chain length == slotManagerStatics.<role>.maxAttempts (3): the budget is spent.
        const chainOriginal = OperationItemStub({
          id: OP1_ID,
          role,
          text: 'verify: quest flows',
          status: 'complete',
          locked: true,
        });
        const chainPt2 = OperationItemStub({
          id: OP2_ID,
          role,
          text: 'pt 2: verify: quest flows',
          status: 'complete',
          locked: true,
        });
        const chainPt3 = OperationItemStub({
          id: OP3_ID,
          role,
          text: 'pt 3: verify: quest flows',
          status: 'in_progress',
          locked: true,
        });
        const quest = QuestStub({
          operations: [chainOriginal, chainPt2, chainPt3],
          workItems: [
            WorkItemStub({
              id: itemId,
              role,
              status: 'in_progress',
              relatedDataItems: [`operations/${OP3_ID}`],
            }),
            WorkItemStub({
              id: pendingId,
              role: 'blightwarden',
              status: 'pending',
              dependsOn: [itemId],
            }),
          ],
        });
        const questAfterOutcome = QuestStub({
          operations: [
            chainOriginal,
            chainPt2,
            OperationItemStub({
              id: OP3_ID,
              role,
              text: 'pt 3: verify: quest flows',
              status: 'complete',
              locked: true,
            }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role,
              status: 'complete',
              relatedDataItems: [`operations/${OP3_ID}`],
              completedAt: FIXED_TIMESTAMP,
              actualSignal: 'complete',
            }),
            WorkItemStub({
              id: pendingId,
              role: 'blightwarden',
              status: 'pending',
              dependsOn: [itemId],
            }),
          ],
          updatedAt: FIXED_TIMESTAMP,
        });
        proxy.setupSignalBlocked({ quest, questAfterOutcome });

        const result = await QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'partial',
        });

        expect(result).toStrictEqual({ success: true });
        // Persist 1 (the responder's own atomic outcome write) completes the chain WITHOUT a
        // 'pt 4' continuation; persist 2 is the real questBlockOnFailureBroker's modify.
        expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);

        const finalQuest = proxy.getLastPersistedQuest();

        expect({
          persistedStatuses: proxy.getAllPersistedQuests().map(({ status }) => status),
          finalWorkItems: finalQuest.workItems.map(({ id, status }) => ({ id, status })),
          finalOperationTexts: finalQuest.operations.map(({ text }) => String(text)),
        }).toStrictEqual({
          persistedStatuses: ['in_progress', 'blocked'],
          finalWorkItems: [
            { id: itemId, status: 'complete' },
            { id: pendingId, status: 'skipped' },
          ],
          finalOperationTexts: [
            'verify: quest flows',
            'pt 2: verify: quest flows',
            'pt 3: verify: quest flows',
          ],
        });
      },
    );
  });
});
