import {
  BlightChecklistStub,
  BlockedReasonStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowOffMapSignoffStub,
  FlowStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestIdStub,
  QuestPackageEntryStub,
  QuestStub,
  QuestWorkItemIdStub,
  SignoffStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';
import {
  qaOffMapProbeStatics,
  textDisplaySymbolsStatics,
  workItemRoleStatics,
} from '@dungeonmaster/shared/statics';

import { blightscoutOperationStatics } from '../../../statics/blightscout-operation/blightscout-operation-statics';
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

// The two ids the responder mints for the auto-appended standards review, in the order it mints
// them: the operation item first, then its linked work item, both ahead of any pt continuation.
const SCOUT_OP_UUID = 'd1d2d3d4-e5e6-4f7a-8b9c-0d1e2f3a4b5c';
const SCOUT_WI_UUID = 'e1e2e3e4-f5f6-4a7b-8c9d-0e1f2a3b4c5d';

// The scout text the responder mints for each completed (role, operation item) pair the cases below
// exercise — the statics template with its placeholder filled by that item's role and id, exactly
// as the append site composes it. Five texts rather than one shared sentence because
// `operationPtChainTransformer` keys a chain on role + BASE TEXT: a scout naming the commit it
// reviews is its own chain with its own `slotManagerStatics.blightscout.maxAttempts` budget, while
// one shared sentence makes every scout on a quest one chain that the fourth `partial` exhausts.
const SCOUT_TEXT_CODEWEAVER_OP1 = blightscoutOperationStatics.textTemplate.replace(
  blightscoutOperationStatics.placeholders.reviewedOperation,
  `codeweaver ${OP1_ID}`,
);
const SCOUT_TEXT_CODEWEAVER_OP2 = blightscoutOperationStatics.textTemplate.replace(
  blightscoutOperationStatics.placeholders.reviewedOperation,
  `codeweaver ${OP2_ID}`,
);
const SCOUT_TEXT_CODEWEAVER_OP3 = blightscoutOperationStatics.textTemplate.replace(
  blightscoutOperationStatics.placeholders.reviewedOperation,
  `codeweaver ${OP3_ID}`,
);
const SCOUT_TEXT_FLOWRIDER_OP1 = blightscoutOperationStatics.textTemplate.replace(
  blightscoutOperationStatics.placeholders.reviewedOperation,
  `flowrider ${OP1_ID}`,
);
const SCOUT_TEXT_SIEGEMASTER_OP2 = blightscoutOperationStatics.textTemplate.replace(
  blightscoutOperationStatics.placeholders.reviewedOperation,
  `siegemaster ${OP2_ID}`,
);

// The scout pair every committing session earns. Its SCOPE never varies with the signalling item —
// a commit is not a slice of the spine, so no flowIds or packageNames ride along — which is exactly
// what these shared constants pin. `dependsOn` names the signalling work item (ITEM_ID in every
// case below), so the review can never be dispatched alongside the work it reviews. Cases
// completing an item other than the codeweaver OP1_ID one spread this and override `text`.
const SCOUT_OPERATION = OperationItemStub({
  id: SCOUT_OP_UUID,
  role: 'blightscout',
  text: SCOUT_TEXT_CODEWEAVER_OP1,
  status: 'pending',
  locked: true,
});
const SCOUT_WORK_ITEM = WorkItemStub({
  id: SCOUT_WI_UUID,
  role: 'blightscout',
  status: 'pending',
  spawnerType: 'agent',
  relatedDataItems: [`operations/${SCOUT_OP_UUID}`],
  dependsOn: [ITEM_ID],
  createdAt: FIXED_TIMESTAMP,
});

// The (fictional) changed file the blightscout completion gate tests below stage as the sole
// outstanding checklist unit.
const BLIGHT_FILE = 'packages/orchestrator/src/foo/foo-broker.ts';

type SlotManagerRole = keyof typeof slotManagerStatics;
type PtBudgetRole = Exclude<SlotManagerRole, 'ward' | 'orphanRecovery'>;

// Locked verify-tail roles whose pt chain is bounded by slotManagerStatics.<role>.maxAttempts —
// derived from the statics so a newly budgeted role is swept into the block matrix automatically.
const PT_BUDGET_ROLES = (Object.keys(slotManagerStatics) as readonly SlotManagerRole[]).filter(
  (role): role is PtBudgetRole => 'maxAttempts' in slotManagerStatics[role],
);

// Roles the responder exempts from any pt budget: the maxAttempts ladder returns `undefined` for
// every CHAT role (isChatWorkItemRoleGuard) plus `ward` (whose own retry budget lives on
// `slotManagerStatics.ward.maxRetries`, not `maxAttempts`) — there is no minion-role branch, since
// every minion is parent-summoned and never owns an operation item this ladder runs against.
// Derived from `workItemRoleStatics.chat` so a chat role added there is swept into the matrix
// automatically instead of going quietly untested.
const UNBOUNDED_PT_ROLES = [...workItemRoleStatics.chat, 'ward'] as const;

// The off-map probe families a node-less, edge-less flow decomposes into — the whole outstanding set
// in the gate test below. Derived from the probe statics, whose keys are pinned 1:1 with
// qaOffMapFamilyContract's options, so a new family moves this count instead of reddening the test.
const OFF_MAP_FAMILIES = Object.keys(qaOffMapProbeStatics.byFamily);
const OFF_MAP_FAMILY_COUNT = OFF_MAP_FAMILIES.length;

type SignoffVerdict = ReturnType<typeof SignoffStub>['verdict'];

// The verdicts a sign-off can carry. `textDisplaySymbolsStatics.signoffVerdictMarks` is keyed 1:1
// with signoffVerdictContract's options and its colocated test pins that, so it is the honest source
// a test file can reach (enforce-contract-usage-in-tests allows stubs only).
const SIGNOFF_VERDICTS = Object.keys(
  textDisplaySymbolsStatics.signoffVerdictMarks,
) as SignoffVerdict[];

// The two packages the groundstomper gate tests below tag their nodes with. `ui-app` resolves to a
// browser-reachable kind and `api-service` does not, which is the axis that decides whether a
// groundstomper item is gated on a unit at all. Named nowhere in source — the rule is `packageType`,
// never a package name.
const UI_PACKAGE = 'ui-app';
const API_PACKAGE = 'api-service';
const PACKAGES_AFFECTED = [
  QuestPackageEntryStub({
    name: UI_PACKAGE,
    location: `./packages/${UI_PACKAGE}`,
    changeType: 'edit',
    packageType: 'frontend-react',
  }),
  QuestPackageEntryStub({
    name: API_PACKAGE,
    location: `./packages/${API_PACKAGE}`,
    changeType: 'edit',
    packageType: 'http-backend',
  }),
];

describe('QuestHandleSignalBackResponder', () => {
  describe('signal failures surface (never silently drop the signal)', () => {
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

    // An id that is not on the quest at all is NOT a redelivery — no legitimate path produces one,
    // and the redelivery case is the already-terminal branch below. Reporting success for it lets an
    // agent end its turn believing it signalled while its REAL work item stays `in_progress` until
    // orphan recovery spends a reset on it, and the agent has no way to detect the mistake. Throw
    // for exactly the reason the unreadable-quest branch throws: the failure must ride back up the
    // awaited signal-back path to the agent instead of vanishing behind a green response.
    it('ERROR: {work item not on quest} => throws naming the quest and work item, persisting nothing', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const quest = QuestStub({
        operations: [OperationItemStub({ id: OP1_ID, status: 'in_progress' })],
        workItems: [],
      });
      proxy.setupQuest({ quest });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: QuestWorkItemIdStub({ value: ITEM_ID }),
          signal: 'complete',
        }),
      ).rejects.toThrow(
        /signal-back: work item a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d is not on quest add-auth/u,
      );

      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });
  });

  describe('idempotent no-ops', () => {
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
    // The whole blightscout append lands in the SAME persist as the terminal work item and the
    // completed operation — operation AND work item together, ahead of the still-pending tail — so
    // a crash is all-or-nothing. Advance then mints nothing: the scout is the first pending
    // operation and it already carries a linked work item, which is exactly what
    // questAdvanceBroker's strict-1:1 resume guard refuses to duplicate.
    it("VALID: {codeweaver 'done', next op pending} => ONE persist completes item+operation and appends the scout operation WITH its work item; advance mints nothing", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const op2Pending = OperationItemStub({
        id: OP2_ID,
        role: 'siegemaster',
        text: 'qa: login flow',
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
        operations: [op1Complete, SCOUT_OPERATION, op2Pending],
        workItems: [completedItem, SCOUT_WORK_ITEM],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [SCOUT_OP_UUID, SCOUT_WI_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });

    // The termination proof, driven end to end: `blightscout` is not in
    // blightscoutOperationStatics.committingRoles, so a scout going complete appends NO successor
    // and the relay moves on to the next seeded item instead of reviewing its own review forever.
    it("VALID: {blightscout 'done', next op pending} => no second scout is appended and advance creates the next work item", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const op2Pending = OperationItemStub({
        id: OP2_ID,
        role: 'ward',
        text: 'Ward gate (full monorepo)',
        status: 'pending',
        locked: true,
        wardMode: 'full',
      });
      const scoutOp = OperationItemStub({
        id: OP1_ID,
        role: 'blightscout',
        // A review of an earlier codeweaver commit, minted the way the append site mints it —
        // naming the item it reviews, so it keys its own chain rather than the whole quest's.
        text: SCOUT_TEXT_CODEWEAVER_OP3,
        status: 'in_progress',
        locked: true,
      });
      const quest = QuestStub({
        operations: [scoutOp, op2Pending],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'blightscout',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const completedItem = WorkItemStub({
        id: itemId,
        role: 'blightscout',
        status: 'complete',
        relatedDataItems: [`operations/${OP1_ID}`],
        completedAt: FIXED_TIMESTAMP,
        actualSignal: 'complete',
      });
      const questAfterOutcome = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'blightscout',
            text: SCOUT_TEXT_CODEWEAVER_OP3,
            status: 'complete',
            locked: true,
          }),
          op2Pending,
        ],
        workItems: [completedItem],
        updatedAt: FIXED_TIMESTAMP,
      });
      // The quest pins no baseRef, so the blightscout completion gate resolves to a null checklist
      // and does not bind — this case is about the append, not about the gate.
      proxy.setupSignalFlowWithBlightChecklist({ quest, questAfterOutcome, checklist: null });
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
            OperationItemStub({
              id: OP1_ID,
              role: 'blightscout',
              text: SCOUT_TEXT_CODEWEAVER_OP3,
              status: 'complete',
              locked: true,
            }),
            OperationItemStub({
              id: OP2_ID,
              role: 'ward',
              text: 'Ward gate (full monorepo)',
              status: 'in_progress',
              locked: true,
              wardMode: 'full',
            }),
          ],
          workItems: [
            completedItem,
            WorkItemStub({
              id: ADVANCE_UUID,
              role: 'ward',
              status: 'pending',
              spawnerType: 'command',
              relatedDataItems: [`operations/${OP2_ID}`],
              dependsOn: [itemId],
              wardMode: 'full',
              createdAt: FIXED_TIMESTAMP,
            }),
          ],
          updatedAt: FIXED_TIMESTAMP,
        }),
      ]);
    });

    // ward is `spawnerType: 'command'` and writes no code, so it is absent from
    // blightscoutOperationStatics.committingRoles — a green gate run earns no standards review.
    it("VALID: {ward 'done', ledger drained} => no scout is appended, because a command run commits nothing", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'ward',
            text: 'Ward gate (full monorepo)',
            status: 'in_progress',
            locked: true,
            wardMode: 'full',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'ward',
            status: 'in_progress',
            spawnerType: 'command',
            relatedDataItems: [`operations/${OP1_ID}`],
            wardMode: 'full',
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'ward',
            text: 'Ward gate (full monorepo)',
            status: 'complete',
            locked: true,
            wardMode: 'full',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'ward',
            status: 'complete',
            spawnerType: 'command',
            relatedDataItems: [`operations/${OP1_ID}`],
            wardMode: 'full',
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
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });

    it('VALID: {operationStatus absent, last op} => operation completed in the same persist, ledger drained derives quest complete', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'blightscout',
            text: 'audit: whole diff',
            status: 'in_progress',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'blightscout',
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
            role: 'blightscout',
            text: 'audit: whole diff',
            status: 'complete',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'blightscout',
            status: 'complete',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      // This item's role is blightscout, so the completion gate now runs the blight-checklist
      // broker too; the quest carries no baseRef, so it resolves to null and the gate does not
      // bind (see the dedicated "no baseRef pinned" gate test below for that path's own coverage).
      proxy.setupSignalFlowWithBlightChecklist({ quest, questAfterOutcome, checklist: null });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });
  });

  describe("completion gate — 'done' is refused while units carry no siegemasterSignoff", () => {
    it("ERROR: {siegemaster item scoped to a flow, no sign-offs, 'done'} => throws naming the outstanding count", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          flows: [FlowStub({ id: 'login-flow', nodes: [], edges: [] })],
          planningNotes: { blightReports: [], qaLedger: [] },
          operations: [
            OperationItemStub({
              id: OP1_ID,
              role: 'siegemaster',
              status: 'in_progress',
              locked: true,
              flowIds: ['login-flow'],
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
        }),
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        new RegExp(
          `signal-back refused: operationStatus 'done'.*${String(OFF_MAP_FAMILY_COUNT)} still carry none`,
          'su',
        ),
      );
    });

    it("ERROR: {refused 'done'} => nothing is persisted, so the session can carry on and signal again", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          flows: [FlowStub({ id: 'login-flow', nodes: [], edges: [] })],
          planningNotes: { blightReports: [], qaLedger: [] },
          operations: [
            OperationItemStub({
              id: OP1_ID,
              role: 'siegemaster',
              status: 'in_progress',
              locked: true,
              flowIds: ['login-flow'],
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
        }),
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(/signal-back refused/u);
      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });

    it("VALID: {every off-map family carries a siegemasterSignoff, 'done'} => the gate clears and the outcome applies", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const signedFlow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [],
        edges: [],
        offMapSignoffs: OFF_MAP_FAMILIES.map((family) =>
          FlowOffMapSignoffStub({ id: family as never, siegemasterSignoff: SignoffStub() }),
        ),
      });
      const siegeOp = OperationItemStub({
        id: OP1_ID,
        role: 'siegemaster',
        status: 'in_progress',
        locked: true,
        flowIds: ['login-flow'],
      });
      const quest = QuestStub({
        flows: [signedFlow],
        operations: [siegeOp],
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
        status: 'complete',
        flows: [signedFlow],
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'siegemaster',
            status: 'complete',
            locked: true,
            flowIds: ['login-flow'],
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
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
    });

    it("VALID: {uncovered siegemaster item, 'partial'} => NOT gated, because partial is the honest escape", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const siegeOp = OperationItemStub({
        id: OP1_ID,
        role: 'siegemaster',
        text: 'Siegemaster: manual-QA this flow',
        status: 'in_progress',
        locked: true,
        flowIds: ['login-flow'],
      });
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow', nodes: [], edges: [] })],
        planningNotes: { blightReports: [], qaLedger: [] },
        operations: [siegeOp],
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
        flows: [FlowStub({ id: 'login-flow', nodes: [], edges: [] })],
        planningNotes: { blightReports: [], qaLedger: [] },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'siegemaster',
            text: 'Siegemaster: manual-QA this flow',
            status: 'complete',
            locked: true,
            flowIds: ['login-flow'],
          }),
          OperationItemStub({
            id: CONTINUATION_UUID,
            role: 'siegemaster',
            text: 'pt 2: Siegemaster: manual-QA this flow',
            status: 'pending',
            locked: true,
            flowIds: ['login-flow'],
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
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });
      proxy.setupAdvanceUuids({ ids: [ADVANCE_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
    });

    it("VALID: {siegemaster item declaring no flowIds, 'done'} => NOT gated, so a flow-less quest still completes", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const siegeOp = OperationItemStub({
        id: OP1_ID,
        role: 'siegemaster',
        status: 'in_progress',
        locked: true,
        flowIds: [],
      });
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow', nodes: [], edges: [] })],
        planningNotes: { blightReports: [], qaLedger: [] },
        operations: [siegeOp],
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
        status: 'complete',
        flows: [FlowStub({ id: 'login-flow', nodes: [], edges: [] })],
        planningNotes: { blightReports: [], qaLedger: [] },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'siegemaster',
            status: 'complete',
            locked: true,
            flowIds: [],
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
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe("completion gate — 'done' is refused while units carry no flowriderSignoff", () => {
    it("ERROR: {flowrider item, one unsigned runtime unit, 'done'} => refused, and the message NAMES the outstanding unit id and the field to write", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          flows: [
            FlowStub({
              id: 'login-flow',
              flowType: 'runtime',
              nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard' })],
              edges: [],
            }),
          ],
          operations: [
            OperationItemStub({
              id: OP1_ID,
              role: 'flowrider',
              status: 'in_progress',
              locked: true,
              flowIds: ['login-flow'],
            }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role: 'flowrider',
              status: 'in_progress',
              relatedDataItems: [`operations/${OP1_ID}`],
            }),
          ],
        }),
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        /signal-back refused: operationStatus 'done'.*`flowriderSignoff`.*1 still carry none.*- login-flow:terminal:dashboard/su,
      );
    });

    it("VALID: {flowrider item, every runtime unit carries a flowriderSignoff, 'done'} => the gate clears and the outcome applies", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const signedFlow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({ id: 'dashboard', label: 'Dashboard', flowriderSignoff: SignoffStub() }),
        ],
        edges: [],
      });
      const flowOp = OperationItemStub({
        id: OP1_ID,
        role: 'flowrider',
        status: 'in_progress',
        locked: true,
        flowIds: ['login-flow'],
      });
      const quest = QuestStub({
        flows: [signedFlow],
        operations: [flowOp],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'flowrider',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        flows: [signedFlow],
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'flowrider',
            status: 'complete',
            locked: true,
            flowIds: ['login-flow'],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'flowrider',
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
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
    });

    it("VALID: {flowrider item, an `unconfirmable` flowriderSignoff, 'done'} => clears the gate exactly like `confirmed`", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const signedFlow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({
            id: 'dashboard',
            label: 'Dashboard',
            flowriderSignoff: SignoffStub({
              verdict: 'unconfirmable',
              evidence: 'the dashboard route 500s under jsdom before any assertion can run',
              question: 'does the dashboard need a real browser to render at all?',
            }),
          }),
        ],
        edges: [],
      });
      const flowOp = OperationItemStub({
        id: OP1_ID,
        role: 'flowrider',
        status: 'in_progress',
        locked: true,
        flowIds: ['login-flow'],
      });
      const quest = QuestStub({
        flows: [signedFlow],
        operations: [flowOp],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'flowrider',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        flows: [signedFlow],
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'flowrider',
            status: 'complete',
            locked: true,
            flowIds: ['login-flow'],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'flowrider',
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
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
    });

    it("VALID: {flowrider item, every flow OPERATIONAL, 'done'} => accepted, because the flowrider track is measured over runtime flows alone", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const operationalFlow = FlowStub({
        id: 'rollout-flow',
        name: 'Rollout Flow',
        flowType: 'operational',
        nodes: [FlowNodeStub({ id: 'rule-registered', label: 'Rule registered' })],
        edges: [],
      });
      const flowOp = OperationItemStub({
        id: OP1_ID,
        role: 'flowrider',
        status: 'in_progress',
        locked: true,
        flowIds: [],
      });
      const quest = QuestStub({
        flows: [operationalFlow],
        operations: [flowOp],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'flowrider',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        flows: [operationalFlow],
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'flowrider',
            status: 'complete',
            locked: true,
            flowIds: [],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'flowrider',
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
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
    });

    it("ERROR: {the SAME operational flow plus one runtime flow, flowrider 'done'} => refused naming the runtime flow's unit, proving the accept above was zero units and not a skipped gate", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          flows: [
            FlowStub({
              id: 'rollout-flow',
              name: 'Rollout Flow',
              flowType: 'operational',
              nodes: [FlowNodeStub({ id: 'rule-registered', label: 'Rule registered' })],
              edges: [],
            }),
            FlowStub({
              id: 'login-flow',
              flowType: 'runtime',
              nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard' })],
              edges: [],
            }),
          ],
          operations: [
            OperationItemStub({
              id: OP1_ID,
              role: 'flowrider',
              status: 'in_progress',
              locked: true,
              flowIds: [],
            }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role: 'flowrider',
              status: 'in_progress',
              relatedDataItems: [`operations/${OP1_ID}`],
            }),
          ],
        }),
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        /signal-back refused: operationStatus 'done'.*1 still carry none.*- login-flow:terminal:dashboard/su,
      );
    });
  });

  describe('completion gate — a groundstomper item is gated on the units a browser can reach, over the SAME `flowriderSignoff` field', () => {
    it("ERROR: {groundstomper item, one unsigned frontend-tagged unit, 'done'} => refused, and the remedy names `flowriderSignoff` — the field Groundstomper actually writes", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          packagesAffected: PACKAGES_AFFECTED,
          flows: [
            FlowStub({
              id: 'login-flow',
              flowType: 'runtime',
              nodes: [
                FlowNodeStub({ id: 'dashboard', label: 'Dashboard', packages: [UI_PACKAGE] }),
              ],
              edges: [],
            }),
          ],
          operations: [
            OperationItemStub({
              id: OP1_ID,
              role: 'groundstomper',
              status: 'in_progress',
              locked: true,
              flowIds: ['login-flow'],
            }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role: 'groundstomper',
              status: 'in_progress',
              relatedDataItems: [`operations/${OP1_ID}`],
            }),
          ],
        }),
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        /signal-back refused: operationStatus 'done'.*`flowriderSignoff`.*1 still carry none.*Outstanding units:.*- login-flow:terminal:dashboard.*Write a `flowriderSignoff` on each remaining unit/su,
      );
    });

    // The refusal has to hand back a call that REPRODUCES the list it just measured. Naming the
    // sign-off field there would send a groundstomper session to `track: 'flowrider'`, whose package
    // kinds are the exact complement of its own — it would read zero, signal `done` again, and be
    // refused again on the same unit with no way to see it. The item's own slice rides along for the
    // same reason: the gate narrowed by it and the tool will not unless asked.
    it("ERROR: {groundstomper item declaring packageNames, 'done'} => the refusal names get-qa-checklist with the DENOMINATOR track and that slice", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          packagesAffected: PACKAGES_AFFECTED,
          flows: [
            FlowStub({
              id: 'login-flow',
              flowType: 'runtime',
              nodes: [
                FlowNodeStub({ id: 'dashboard', label: 'Dashboard', packages: [UI_PACKAGE] }),
              ],
              edges: [],
            }),
          ],
          operations: [
            OperationItemStub({
              id: OP1_ID,
              role: 'groundstomper',
              status: 'in_progress',
              locked: true,
              flowIds: ['login-flow'],
              packageNames: [UI_PACKAGE],
            }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role: 'groundstomper',
              status: 'in_progress',
              relatedDataItems: [`operations/${OP1_ID}`],
            }),
          ],
        }),
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        /Read the same list back with get-qa-checklist\(\{ track: 'groundstomper', packageNames: \['ui-app'\] \}\)\./u,
      );
    });

    it("ERROR: {groundstomper item declaring NO packageNames, 'done'} => the reproduction call carries the track alone", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          packagesAffected: PACKAGES_AFFECTED,
          flows: [
            FlowStub({
              id: 'login-flow',
              flowType: 'runtime',
              nodes: [
                FlowNodeStub({ id: 'dashboard', label: 'Dashboard', packages: [UI_PACKAGE] }),
              ],
              edges: [],
            }),
          ],
          operations: [
            OperationItemStub({
              id: OP1_ID,
              role: 'groundstomper',
              status: 'in_progress',
              locked: true,
              flowIds: ['login-flow'],
            }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role: 'groundstomper',
              status: 'in_progress',
              relatedDataItems: [`operations/${OP1_ID}`],
            }),
          ],
        }),
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        /Read the same list back with get-qa-checklist\(\{ track: 'groundstomper' \}\)\./u,
      );
    });

    it("VALID: {the SAME unsigned unit tagged to a package no browser can reach, groundstomper 'done'} => accepted, because that unit is Flowrider's", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const backendFlow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard', packages: [API_PACKAGE] })],
        edges: [],
      });
      const stompOp = OperationItemStub({
        id: OP1_ID,
        role: 'groundstomper',
        status: 'in_progress',
        locked: true,
        flowIds: ['login-flow'],
      });
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        flows: [backendFlow],
        operations: [stompOp],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'groundstomper',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        packagesAffected: PACKAGES_AFFECTED,
        flows: [backendFlow],
        operations: [OperationItemStub({ ...stompOp, status: 'complete' })],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'groundstomper',
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
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
    });

    it("VALID: {flowrider item, an unsigned FRONTEND-tagged unit, 'done'} => accepted, because Groundstomper owns the browser-reachable slice", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const frontendFlow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [FlowNodeStub({ id: 'dashboard', label: 'Dashboard', packages: [UI_PACKAGE] })],
        edges: [],
      });
      const flowOp = OperationItemStub({
        id: OP1_ID,
        role: 'flowrider',
        status: 'in_progress',
        locked: true,
        flowIds: ['login-flow'],
      });
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        flows: [frontendFlow],
        operations: [flowOp],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'flowrider',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        packagesAffected: PACKAGES_AFFECTED,
        flows: [frontendFlow],
        operations: [OperationItemStub({ ...flowOp, status: 'complete' })],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'flowrider',
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
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
    });

    it.each(SIGNOFF_VERDICTS)(
      "VALID: {groundstomper item, the frontend unit carries a flowriderSignoff verdict: %s, 'done'} => accepted, because the gate refuses ABSENCE and not honesty",
      async (verdict) => {
        const proxy = QuestHandleSignalBackResponderProxy();
        const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
        const signedFlow = FlowStub({
          id: 'login-flow',
          flowType: 'runtime',
          nodes: [
            FlowNodeStub({
              id: 'dashboard',
              label: 'Dashboard',
              packages: [UI_PACKAGE],
              flowriderSignoff: SignoffStub({
                verdict,
                evidence:
                  'packages/ui-app/src/flows/login/login.e2e.ts:31 — reds when the dashboard route is removed',
                question: 'does the dashboard need a seeded session before it can render at all?',
              }),
            }),
          ],
          edges: [],
        });
        const stompOp = OperationItemStub({
          id: OP1_ID,
          role: 'groundstomper',
          status: 'in_progress',
          locked: true,
          flowIds: ['login-flow'],
        });
        const quest = QuestStub({
          packagesAffected: PACKAGES_AFFECTED,
          flows: [signedFlow],
          operations: [stompOp],
          workItems: [
            WorkItemStub({
              id: itemId,
              role: 'groundstomper',
              status: 'in_progress',
              relatedDataItems: [`operations/${OP1_ID}`],
            }),
          ],
        });
        const questAfterOutcome = QuestStub({
          status: 'complete',
          packagesAffected: PACKAGES_AFFECTED,
          flows: [signedFlow],
          operations: [OperationItemStub({ ...stompOp, status: 'complete' })],
          workItems: [
            WorkItemStub({
              id: itemId,
              role: 'groundstomper',
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
          operationStatus: 'done',
        });

        expect(result).toStrictEqual({ success: true });
      },
    );

    it("ERROR: {groundstomper item, a zero-observable DECISION node's branch tagged frontend, 'done'} => refused on the branch unit, which no observable-keyed slicer would have carried", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          packagesAffected: PACKAGES_AFFECTED,
          flows: [
            FlowStub({
              id: 'login-flow',
              flowType: 'runtime',
              nodes: [
                FlowNodeStub({
                  id: 'has-session',
                  label: 'Has session',
                  type: 'decision',
                  packages: [UI_PACKAGE],
                }),
                FlowNodeStub({
                  id: 'dashboard',
                  label: 'Dashboard',
                  packages: [UI_PACKAGE],
                  flowriderSignoff: SignoffStub(),
                }),
              ],
              edges: [
                FlowEdgeStub({
                  id: 'session-valid',
                  from: 'has-session',
                  to: 'dashboard',
                  label: 'session valid',
                }),
              ],
            }),
          ],
          operations: [
            OperationItemStub({
              id: OP1_ID,
              role: 'groundstomper',
              status: 'in_progress',
              locked: true,
              flowIds: ['login-flow'],
            }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role: 'groundstomper',
              status: 'in_progress',
              relatedDataItems: [`operations/${OP1_ID}`],
            }),
          ],
        }),
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        /signal-back refused: operationStatus 'done'.*1 still carry none.*- login-flow:branch:session-valid/su,
      );
    });
  });

  describe('the two tracks are gated independently on the SAME units', () => {
    it("ERROR: {every unit carries a flowriderSignoff only, siegemaster 'done'} => refused, because flowrider's column never settles siegemaster's", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          flows: [
            FlowStub({
              id: 'login-flow',
              flowType: 'runtime',
              nodes: [
                FlowNodeStub({
                  id: 'dashboard',
                  label: 'Dashboard',
                  flowriderSignoff: SignoffStub(),
                }),
              ],
              edges: [],
              offMapSignoffs: OFF_MAP_FAMILIES.map((family) =>
                FlowOffMapSignoffStub({ id: family as never, flowriderSignoff: SignoffStub() }),
              ),
            }),
          ],
          operations: [
            OperationItemStub({
              id: OP1_ID,
              role: 'siegemaster',
              status: 'in_progress',
              locked: true,
              flowIds: ['login-flow'],
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
        }),
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        new RegExp(
          `\`siegemasterSignoff\`.*${String(OFF_MAP_FAMILY_COUNT + 1)} still carry none.*- login-flow:terminal:dashboard`,
          'su',
        ),
      );
    });

    it("ERROR: {every unit carries a siegemasterSignoff only, flowrider 'done'} => refused, because siegemaster's column never settles flowrider's", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          flows: [
            FlowStub({
              id: 'login-flow',
              flowType: 'runtime',
              nodes: [
                FlowNodeStub({
                  id: 'dashboard',
                  label: 'Dashboard',
                  siegemasterSignoff: SignoffStub(),
                }),
              ],
              edges: [],
              offMapSignoffs: OFF_MAP_FAMILIES.map((family) =>
                FlowOffMapSignoffStub({ id: family as never, siegemasterSignoff: SignoffStub() }),
              ),
            }),
          ],
          operations: [
            OperationItemStub({
              id: OP1_ID,
              role: 'flowrider',
              status: 'in_progress',
              locked: true,
              flowIds: ['login-flow'],
            }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role: 'flowrider',
              status: 'in_progress',
              relatedDataItems: [`operations/${OP1_ID}`],
            }),
          ],
        }),
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        /`flowriderSignoff`.*1 still carry none.*- login-flow:terminal:dashboard/su,
      );
    });

    it("VALID: {both tracks signed on the same units, siegemaster 'done'} => the gate clears", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const bothSignedFlow = FlowStub({
        id: 'login-flow',
        flowType: 'runtime',
        nodes: [
          FlowNodeStub({
            id: 'dashboard',
            label: 'Dashboard',
            flowriderSignoff: SignoffStub(),
            siegemasterSignoff: SignoffStub(),
          }),
        ],
        edges: [],
        offMapSignoffs: OFF_MAP_FAMILIES.map((family) =>
          FlowOffMapSignoffStub({
            id: family as never,
            flowriderSignoff: SignoffStub(),
            siegemasterSignoff: SignoffStub(),
          }),
        ),
      });
      const siegeOp = OperationItemStub({
        id: OP1_ID,
        role: 'siegemaster',
        status: 'in_progress',
        locked: true,
        flowIds: ['login-flow'],
      });
      const quest = QuestStub({
        flows: [bothSignedFlow],
        operations: [siegeOp],
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
        status: 'complete',
        flows: [bothSignedFlow],
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'siegemaster',
            status: 'complete',
            locked: true,
            flowIds: ['login-flow'],
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
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe("completion gate — 'done' is refused while blight units carry no disposition", () => {
    it("ERROR: {blightscout item, one undispositioned unit, 'done'} => throws naming that unit id", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        baseRef: 'a1b2c3d4' as never,
        planningNotes: { blightReports: [], qaLedger: [] },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'blightscout',
            status: 'in_progress',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'blightscout',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      proxy.setupQuestWithBlightChecklist({
        quest,
        checklist: BlightChecklistStub({ remainingItemIds: [`${BLIGHT_FILE}:integrity`] }),
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        /signal-back refused: operationStatus 'done'.*1 still carry none.*packages\/orchestrator\/src\/foo\/foo-broker\.ts:integrity/su,
      );
    });

    it("ERROR: {blightscout item, refused 'done'} => nothing is persisted, so the session can carry on and signal again", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        baseRef: 'a1b2c3d4' as never,
        planningNotes: { blightReports: [], qaLedger: [] },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'blightscout',
            status: 'in_progress',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'blightscout',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      proxy.setupQuestWithBlightChecklist({
        quest,
        checklist: BlightChecklistStub({ remainingItemIds: [`${BLIGHT_FILE}:integrity`] }),
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(/signal-back refused/u);
      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });

    it("VALID: {blightscout item, every unit dispositioned, 'done'} => the gate clears and the outcome applies", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const blightOp = OperationItemStub({
        id: OP1_ID,
        role: 'blightscout',
        status: 'in_progress',
        locked: true,
      });
      const quest = QuestStub({
        baseRef: 'a1b2c3d4' as never,
        planningNotes: { blightReports: [], qaLedger: [] },
        operations: [blightOp],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'blightscout',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        baseRef: 'a1b2c3d4' as never,
        planningNotes: { blightReports: [], qaLedger: [] },
        operations: [
          OperationItemStub({ id: OP1_ID, role: 'blightscout', status: 'complete', locked: true }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'blightscout',
            status: 'complete',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlowWithBlightChecklist({
        quest,
        questAfterOutcome,
        checklist: BlightChecklistStub({ remainingItemIds: [] }),
      });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
    });

    it("VALID: {uncovered blightscout item, 'partial'} => NOT gated, because partial is the honest escape and never invokes the checklist broker", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const blightOp = OperationItemStub({
        id: OP1_ID,
        role: 'blightscout',
        text: 'Blightscout: cross-cutting whole-diff audit',
        status: 'in_progress',
        locked: true,
      });
      const quest = QuestStub({
        planningNotes: { blightReports: [], qaLedger: [] },
        operations: [blightOp],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'blightscout',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        planningNotes: { blightReports: [], qaLedger: [] },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'blightscout',
            text: 'Blightscout: cross-cutting whole-diff audit',
            status: 'complete',
            locked: true,
          }),
          OperationItemStub({
            id: CONTINUATION_UUID,
            role: 'blightscout',
            text: 'pt 2: Blightscout: cross-cutting whole-diff audit',
            status: 'pending',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'blightscout',
            status: 'complete',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });
      proxy.setupAdvanceUuids({ ids: [ADVANCE_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getBlightChecklistCallArgs()).toStrictEqual([]);
    });

    it("VALID: {blightscout item, no baseRef pinned, 'done'} => NOT gated, so a quest whose review base was never pinned still completes", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const blightOp = OperationItemStub({
        id: OP1_ID,
        role: 'blightscout',
        status: 'in_progress',
        locked: true,
      });
      const quest = QuestStub({
        planningNotes: { blightReports: [], qaLedger: [] },
        operations: [blightOp],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'blightscout',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        planningNotes: { blightReports: [], qaLedger: [] },
        operations: [
          OperationItemStub({ id: OP1_ID, role: 'blightscout', status: 'complete', locked: true }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'blightscout',
            status: 'complete',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlowWithBlightChecklist({ quest, questAfterOutcome, checklist: null });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
    });

    it("VALID: {codeweaver item, 'done'} => the blight checklist broker is never called, so no git diff runs on a non-blightscout signal", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'in_progress',
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
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        operations: [op1Complete],
        workItems: [completedItem],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getBlightChecklistCallArgs()).toStrictEqual([]);
    });
  });

  describe("operationStatus 'partial' — pt continuation duplicated after the completed item", () => {
    // The scout is inserted BETWEEN the completed item and its own pt continuation, never after it.
    // Its scope is `HEAD~1...HEAD`, so letting the continuation run first would move HEAD~1 onto the
    // continuation's commit and leave the partial session's commit permanently unreviewed.
    it("VALID: {unlocked codeweaver, first 'partial'} => same persist appends the scout AND 'pt 2: <base>' after it, in that order", async () => {
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
        operations: [op1Complete, SCOUT_OPERATION, continuation],
        workItems: [completedItem, SCOUT_WORK_ITEM],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [SCOUT_OP_UUID, SCOUT_WI_UUID, CONTINUATION_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
      // ONE persist. Advance adds nothing on top: the scout is the first pending operation and it
      // already carries its work item, so the continuation waits for the review to finish.
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });

    it("VALID: {whole-quest flowrider item, 'partial'} => continuation carries the same flowIds so the fresh session keeps every flow", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const flowText = 'Flowrider: author the flow-perspective test suites across every quest flow';
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'flowrider',
            text: flowText,
            status: 'in_progress',
            locked: true,
            flowIds: ['send-comment', 'view-comments'],
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'flowrider',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const completedItem = WorkItemStub({
        id: itemId,
        role: 'flowrider',
        status: 'complete',
        relatedDataItems: [`operations/${OP1_ID}`],
        completedAt: FIXED_TIMESTAMP,
        actualSignal: 'complete',
      });
      const op1Complete = OperationItemStub({
        id: OP1_ID,
        role: 'flowrider',
        text: flowText,
        status: 'complete',
        locked: true,
        flowIds: ['send-comment', 'view-comments'],
      });
      const continuation = OperationItemStub({
        id: CONTINUATION_UUID,
        role: 'flowrider',
        text: `pt 2: ${flowText}`,
        status: 'pending',
        locked: true,
        flowIds: ['send-comment', 'view-comments'],
      });
      // A flowrider commit, so the scout's text names the flowrider item — the review of THIS
      // commit, keyed apart from every scout following a codeweaver session.
      const scoutOperation = OperationItemStub({
        ...SCOUT_OPERATION,
        text: SCOUT_TEXT_FLOWRIDER_OP1,
      });
      const questAfterOutcome = QuestStub({
        operations: [op1Complete, scoutOperation, continuation],
        workItems: [completedItem, SCOUT_WORK_ITEM],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [SCOUT_OP_UUID, SCOUT_WI_UUID, CONTINUATION_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
      // The scout carries NO flowIds of its own even though the item it follows declares two — a
      // commit is not a slice of the spine, so copying them would advertise a narrowing
      // get-blight-checklist never applies.
      expect(proxy.getPersistedQuestAt({ index: 0 }).operations).toStrictEqual([
        op1Complete,
        scoutOperation,
        continuation,
      ]);
    });

    it("VALID: {package-sliced codeweaver item, 'partial'} => continuation carries the same packageNames so the fresh session keeps its slice instead of working the whole quest", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const sliceText = 'ui-app: comment composer widget + binding';
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: sliceText,
            status: 'in_progress',
            locked: false,
            packageNames: [UI_PACKAGE, API_PACKAGE],
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
        text: sliceText,
        status: 'complete',
        locked: false,
        packageNames: [UI_PACKAGE, API_PACKAGE],
      });
      const continuation = OperationItemStub({
        id: CONTINUATION_UUID,
        role: 'codeweaver',
        text: `pt 2: ${sliceText}`,
        status: 'pending',
        locked: false,
        packageNames: [UI_PACKAGE, API_PACKAGE],
      });
      const questAfterOutcome = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        operations: [op1Complete, SCOUT_OPERATION, continuation],
        workItems: [completedItem, SCOUT_WORK_ITEM],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [SCOUT_OP_UUID, SCOUT_WI_UUID, CONTINUATION_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
      // Same contrast on the package axis: the continuation keeps both packages, the scout takes
      // neither, because its denominator comes from the diff rather than from a declared slice.
      expect(proxy.getPersistedQuestAt({ index: 0 }).operations).toStrictEqual([
        op1Complete,
        SCOUT_OPERATION,
        continuation,
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
          // The reviewed item is the pt-2 continuation, so the scout names ITS id — a second pass
          // over the same scope still lands a second commit, and that commit gets its own review
          // budget rather than sharing the first pass's.
          OperationItemStub({ ...SCOUT_OPERATION, text: SCOUT_TEXT_CODEWEAVER_OP2 }),
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
          SCOUT_WORK_ITEM,
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [SCOUT_OP_UUID, SCOUT_WI_UUID, CONTINUATION_UUID] });

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
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });

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
          OperationItemStub({ ...SCOUT_OPERATION, text: SCOUT_TEXT_CODEWEAVER_OP3 }),
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
          SCOUT_WORK_ITEM,
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [SCOUT_OP_UUID, SCOUT_WI_UUID, CONTINUATION_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
      // Each pass of an unbounded chain earns its own review — the scout mints LOCKED (a bounded
      // three-attempt budget of its own) even when the item it follows is unlocked.
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
        proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });

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
          // The scout lands after the EXPLICITLY named operation, not after the work item's own
          // ref — the append reads the same resolved item the completion did, and its text names
          // that same item (the siegemaster OP2_ID one), never the work item's OP1_ID link.
          OperationItemStub({ ...SCOUT_OPERATION, text: SCOUT_TEXT_SIEGEMASTER_OP2 }),
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
          SCOUT_WORK_ITEM,
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [SCOUT_OP_UUID, SCOUT_WI_UUID] });

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

  describe("operationStatus 'blocked' — environment wall halts the quest with the reason recorded", () => {
    it("VALID: {operationStatus: 'blocked', blockedReason} => work item failed carrying the reason, continuation appended, quest blocked, pending items skipped", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const pendingId = QuestWorkItemIdStub({ value: PENDING_ITEM_ID });
      const blockedReason = BlockedReasonStub({
        value: 'git commit is denied in this dispatched session',
      });
      const pesteaterOp = OperationItemStub({
        id: OP1_ID,
        role: 'pesteater',
        text: 'PestEater: reproduce the bug with a failing test first, then fix it',
        status: 'in_progress',
        locked: true,
      });
      const quest = QuestStub({
        operations: [
          pesteaterOp,
          OperationItemStub({ id: OP2_ID, role: 'ward', text: 'Ward gate', status: 'pending' }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'pesteater',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
          WorkItemStub({ id: pendingId, role: 'ward', status: 'pending', dependsOn: [itemId] }),
        ],
      });
      const questAfterOutcome = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'pesteater',
            text: 'PestEater: reproduce the bug with a failing test first, then fix it',
            status: 'complete',
            locked: true,
          }),
          OperationItemStub({
            id: CONTINUATION_UUID,
            role: 'pesteater',
            text: 'pt 2: PestEater: reproduce the bug with a failing test first, then fix it',
            status: 'pending',
            locked: true,
          }),
          OperationItemStub({ id: OP2_ID, role: 'ward', text: 'Ward gate', status: 'pending' }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'pesteater',
            status: 'failed',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
            errorMessage: 'git commit is denied in this dispatched session',
          }),
          WorkItemStub({ id: pendingId, role: 'ward', status: 'pending', dependsOn: [itemId] }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalBlocked({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'blocked',
        blockedReason,
      });

      expect(result).toStrictEqual({ success: true });
      // NO scout, even though pesteater IS a committing role: an environment wall halts the quest
      // immediately, and questBlockOnFailureBroker drains pending work items to `skipped` — the
      // review would be born dead, and `skipped` never satisfies `dependsOn`. The `finalOperations`
      // assertion below names every item on the ledger, so a scout appearing here would red this.
      expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);

      const finalQuest = proxy.getLastPersistedQuest();

      expect({
        persistedStatuses: proxy.getAllPersistedQuests().map(({ status }) => status),
        finalWorkItems: finalQuest.workItems.map(({ id, status, errorMessage }) => ({
          id,
          status,
          errorMessage,
        })),
        finalOperations: finalQuest.operations.map(({ text, status }) => ({
          text: String(text),
          status,
        })),
      }).toStrictEqual({
        persistedStatuses: ['in_progress', 'blocked'],
        finalWorkItems: [
          {
            id: itemId,
            status: 'failed',
            errorMessage: 'git commit is denied in this dispatched session',
          },
          { id: pendingId, status: 'skipped', errorMessage: undefined },
        ],
        finalOperations: [
          {
            text: 'PestEater: reproduce the bug with a failing test first, then fix it',
            status: 'complete',
          },
          {
            text: 'pt 2: PestEater: reproduce the bug with a failing test first, then fix it',
            status: 'pending',
          },
          { text: 'Ward gate', status: 'pending' },
        ],
      });
    });

    it("VALID: {package-sliced groundstomper item, 'blocked'} => the wall's continuation keeps both flowIds and packageNames, so the resume re-dispatches this slice and not the whole quest", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const blockedReason = BlockedReasonStub({
        value: 'the Playwright browser binary is not installed in this environment',
      });
      const stompText = 'Groundstomper: walk the login flow — flow: login-flow';
      const stompOp = OperationItemStub({
        id: OP1_ID,
        role: 'groundstomper',
        text: stompText,
        status: 'in_progress',
        locked: true,
        flowIds: ['login-flow'],
        packageNames: [UI_PACKAGE],
      });
      const quest = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        operations: [stompOp],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'groundstomper',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const op1Complete = OperationItemStub({ ...stompOp, status: 'complete' });
      const continuation = OperationItemStub({
        id: CONTINUATION_UUID,
        role: 'groundstomper',
        text: `pt 2: ${stompText}`,
        status: 'pending',
        locked: true,
        flowIds: ['login-flow'],
        packageNames: [UI_PACKAGE],
      });
      const questAfterOutcome = QuestStub({
        packagesAffected: PACKAGES_AFFECTED,
        operations: [op1Complete, continuation],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'groundstomper',
            status: 'failed',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
            errorMessage: 'the Playwright browser binary is not installed in this environment',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalBlocked({ quest, questAfterOutcome });
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'blocked',
        blockedReason,
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getPersistedQuestAt({ index: 0 }).operations).toStrictEqual([
        op1Complete,
        continuation,
      ]);
    });

    it.each(PT_BUDGET_ROLES)(
      "VALID: {role: %s, LOCKED chain at maxAttempts, 'blocked'} => the pt budget does NOT gate a wall — 'pt 4' is still appended so a resume re-dispatches this scope",
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
              status: 'failed',
              relatedDataItems: [`operations/${OP3_ID}`],
              completedAt: FIXED_TIMESTAMP,
              actualSignal: 'complete',
              errorMessage: 'the dev server port is already bound by another process',
            }),
          ],
          updatedAt: FIXED_TIMESTAMP,
        });
        proxy.setupSignalBlocked({ quest, questAfterOutcome });
        proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });

        const result = await QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'blocked',
          blockedReason: BlockedReasonStub({
            value: 'the dev server port is already bound by another process',
          }),
        });

        expect(result).toStrictEqual({ success: true });
        expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);
        expect(proxy.getAllPersistedQuests().map(({ status }) => status)).toStrictEqual([
          'in_progress',
          'blocked',
        ]);
      },
    );
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
              role: 'blightscout',
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
              role: 'blightscout',
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
        // 'pt 4' continuation AND without a scout — a spent budget halts the quest exactly as an
        // environment wall does, so a review appended here would only be drained to `skipped`.
        // `finalOperationTexts` below names every ledger item, so a stray scout would red this.
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
