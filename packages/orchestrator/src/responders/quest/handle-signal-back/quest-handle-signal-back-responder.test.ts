import {
  BlockedReasonStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowOffMapSignoffStub,
  FlowStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestBlightLedgerEntryStub,
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

import { agentPromptClassificationStatics } from '../../../statics/agent-prompt-classification/agent-prompt-classification-statics';
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

// The (fictional) changed file the review-coverage cases below disposition.
const BLIGHT_FILE = 'packages/orchestrator/src/foo/foo-broker.ts';

// The trace a reviewer-minion round leaves on the quest: one disposition on one review unit. Spread
// into those quests' `planningNotes` explicitly at each site rather than hidden behind a default, so
// each quest fixture states its own review history.
const REVIEW_LEDGER = [
  QuestBlightLedgerEntryStub({
    itemId: `${BLIGHT_FILE}:craft`,
    workItemId: ITEM_ID,
    createdAt: FIXED_TIMESTAMP,
  }),
];

// The fork point `agentPromptGetBroker` stamps on a work item at its FIRST prompt fetch. The
// review-coverage gate measures `<startRef>..HEAD` from it; a work item carrying none has no range,
// and the gate skips rather than refusing.
const ITEM_START_REF = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0';

// Two review units on the range: one the round's reviewer dispositioned, one it never reached.
const DISPOSITIONED_UNIT_ID = `${BLIGHT_FILE}:craft`;
const OUTSTANDING_UNIT_ID = 'packages/orchestrator/src/bar/bar-broker.ts:craft';

// The five roles that run a planner/worker/reviewer round, read from the same static the responder
// reads, so a role added there joins the review-coverage matrix instead of going untested.
const REVIEWED_ROLES = agentPromptClassificationStatics.operatorRoleNames;

// The two roles outside that list whose session still writes code and therefore still owes a clean
// tree before it signals — the other half of the commit-before-signal matrix.
const NON_REVIEWED_COMMITTING_ROLES = ['spiritmender', 'warpgate'] as const;

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
    // The terminal work item and its completed operation land in ONE persist, so a crash is
    // all-or-nothing, and NOTHING is appended beside them — the standards review of this commit
    // happened inside the session's own turn, via the reviewer-minion whose disposition the
    // review-coverage gate just read. Advance then mints the next work item for the pending tail.
    it("VALID: {codeweaver 'done', next op pending} => ONE persist completes item+operation and appends NO review item; advance creates the next work item", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const op2Pending = OperationItemStub({
        id: OP2_ID,
        role: 'siegemaster',
        text: 'qa: login flow',
        status: 'pending',
      });
      const quest = QuestStub({
        planningNotes: { blightLedger: REVIEW_LEDGER },
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
        planningNotes: { blightLedger: REVIEW_LEDGER },
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
          planningNotes: { blightLedger: REVIEW_LEDGER },
          operations: [
            op1Complete,
            OperationItemStub({
              id: OP2_ID,
              role: 'siegemaster',
              text: 'qa: login flow',
              status: 'in_progress',
            }),
          ],
          workItems: [
            completedItem,
            WorkItemStub({
              id: ADVANCE_UUID,
              role: 'siegemaster',
              status: 'pending',
              relatedDataItems: [`operations/${OP2_ID}`],
              dependsOn: [itemId],
              createdAt: FIXED_TIMESTAMP,
            }),
          ],
          updatedAt: FIXED_TIMESTAMP,
        }),
      ]);
    });

    // The regression guard for the deleted relay role: a completing committing session mints NO
    // extra operation item and NO extra work item of any role. `ward` earns none either — it is a
    // command run that writes no code — so the two cases together pin the whole append surface as
    // empty.
    it.each(REVIEWED_ROLES)(
      "VALID: {%s item, 'done'} => the ledger gains no review operation item and the work-item list gains nothing",
      async (role) => {
        const proxy = QuestHandleSignalBackResponderProxy();
        const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
        const quest = QuestStub({
          planningNotes: { blightLedger: REVIEW_LEDGER },
          operations: [
            OperationItemStub({ id: OP1_ID, role, text: 'round one', status: 'in_progress' }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role,
              status: 'in_progress',
              relatedDataItems: [`operations/${OP1_ID}`],
            }),
          ],
        });
        const questAfterOutcome = QuestStub({
          status: 'complete',
          planningNotes: { blightLedger: REVIEW_LEDGER },
          operations: [
            OperationItemStub({ id: OP1_ID, role, text: 'round one', status: 'complete' }),
          ],
          workItems: [
            WorkItemStub({
              id: itemId,
              role,
              status: 'complete',
              relatedDataItems: [`operations/${OP1_ID}`],
              completedAt: FIXED_TIMESTAMP,
              actualSignal: 'complete',
            }),
          ],
          updatedAt: FIXED_TIMESTAMP,
        });
        proxy.setupSignalFlow({ quest, questAfterOutcome });

        await QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        });

        expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
      },
    );

    it("VALID: {ward 'done', ledger drained} => the work item terminates and nothing is appended, because a command run commits nothing", async () => {
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
            role: 'warpgate',
            text: 'merge: land the quest branch',
            status: 'in_progress',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'warpgate',
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
            role: 'warpgate',
            text: 'merge: land the quest branch',
            status: 'complete',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'warpgate',
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

  describe("completion gate — 'done' is refused while units carry no siegemasterSignoff", () => {
    it("ERROR: {siegemaster item scoped to a flow, no sign-offs, 'done'} => throws naming the outstanding count", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          flows: [FlowStub({ id: 'login-flow', nodes: [], edges: [] })],
          planningNotes: {},
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
          planningNotes: {},
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
        planningNotes: { blightLedger: REVIEW_LEDGER },
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
        planningNotes: {},
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
        planningNotes: {},
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
        planningNotes: { blightLedger: REVIEW_LEDGER },
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
        planningNotes: {},
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
        planningNotes: { blightLedger: REVIEW_LEDGER },
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
        planningNotes: { blightLedger: REVIEW_LEDGER },
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
        planningNotes: { blightLedger: REVIEW_LEDGER },
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
        /signal-back refused: operationStatus 'done'.*`flowriderSignoff`.*1 still carry none.*Outstanding units:.*- login-flow:terminal:dashboard.*Dispatch a `reviewer-minion` over the outstanding units. It writes a `flowriderSignoff` on each/su,
      );
    });

    // The refusal has to hand back a call that REPRODUCES the list it just measured, and that call
    // has to PARSE. `getQaChecklistInputContract` is `.strict()` and accepts `questId` (required),
    // `operationItemId` and `flowId` — `operationItemId` replaced `track`, `flowId` and
    // `packageNames` as separate arguments. A refusal naming `track` or `packageNames` is rejected
    // by zod before the tool runs, so the session never sees the outstanding units and its only move
    // is to downgrade to `partial`.
    //
    // The regex below is anchored on both braces, so it pins the exact key set: an extra key, a
    // missing `questId`, or a reintroduced `track` all fail here. Importing the contract itself to
    // parse the call is not available — `@dungeonmaster/mcp` depends on `@dungeonmaster/orchestrator`
    // and no file in this package imports it, so the reverse import would be a workspace cycle.
    it("ERROR: {groundstomper item declaring packageNames, 'done'} => the refusal names get-qa-checklist with the questId and the operation item id, and no other key", async () => {
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
        new RegExp(
          `Read the same list back with get-qa-checklist\\(\\{ questId: 'add-auth', operationItemId: '${OP1_ID}' \\}\\)\\.`,
          'u',
        ),
      );
    });

    // The slice rides on the id rather than being spelled out, so an item declaring packages and an
    // item declaring none get the SAME two-key call. The tool reads `packageNames` off the item.
    it("ERROR: {groundstomper item declaring NO packageNames, 'done'} => the same two-key call, because the item id carries the slice", async () => {
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
        new RegExp(
          `Read the same list back with get-qa-checklist\\(\\{ questId: 'add-auth', operationItemId: '${OP1_ID}' \\}\\)\\.`,
          'u',
        ),
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
        planningNotes: { blightLedger: REVIEW_LEDGER },
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
        planningNotes: { blightLedger: REVIEW_LEDGER },
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
          planningNotes: { blightLedger: REVIEW_LEDGER },
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
        planningNotes: { blightLedger: REVIEW_LEDGER },
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

  // The successor to the deleted blightscout gate, and the same PER-UNIT shape: every review unit
  // this work item's commits produced needs a disposition, measured over
  // `<the item's recorded startRef>..HEAD`. That range is the only one that sees a whole item —
  // every minion commits its own work as it goes, so at signal time the tree is clean, HEAD~1 holds
  // one piece, and a plan-scoped reading holds one round.
  describe("review-coverage gate — 'done' is refused while any unit in this item's range carries no disposition", () => {
    it.each(REVIEWED_ROLES)(
      "ERROR: {%s item, two files committed and one dispositioned, 'done'} => refused naming the outstanding unit, the range, and the partial escape",
      async (role) => {
        const proxy = QuestHandleSignalBackResponderProxy();
        const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
        proxy.setupQuest({
          quest: QuestStub({
            baseRef: 'deadbeef' as never,
            planningNotes: { blightLedger: REVIEW_LEDGER },
            operations: [
              OperationItemStub({ id: OP1_ID, role, text: 'round one', status: 'in_progress' }),
            ],
            workItems: [
              WorkItemStub({
                id: itemId,
                role,
                status: 'in_progress',
                startRef: ITEM_START_REF,
                relatedDataItems: [`operations/${OP1_ID}`],
              }),
            ],
          }),
        });
        proxy.setupWorktree({ trackedFiles: [], untrackedFiles: [] });
        proxy.setupReviewRemainder({
          dispositionedItemIds: [DISPOSITIONED_UNIT_ID],
          remainingItemIds: [OUTSTANDING_UNIT_ID],
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
            `signal-back refused: operationStatus 'done' means every review unit your commits produced carries a disposition.*1 still carry none.*\`${ITEM_START_REF}\\.\\.HEAD\`.*- ${OUTSTANDING_UNIT_ID}.*Dispatch a \`reviewer-minion\`.*operationStatus: 'partial'`,
            'su',
          ),
        );
      },
    );

    it('ERROR: {codeweaver item refused on review coverage} => nothing is persisted, so the session can dispatch a reviewer and signal again', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          baseRef: 'deadbeef' as never,
          planningNotes: { blightLedger: [] },
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
              startRef: ITEM_START_REF,
              relatedDataItems: [`operations/${OP1_ID}`],
            }),
          ],
        }),
      });
      proxy.setupWorktree({ trackedFiles: [], untrackedFiles: [] });
      proxy.setupReviewRemainder({
        dispositionedItemIds: [],
        remainingItemIds: [DISPOSITIONED_UNIT_ID, OUTSTANDING_UNIT_ID],
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        /signal-back refused: operationStatus 'done' means every review unit your commits produced/u,
      );

      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });

    // The range is the whole point: measured from the quest's pinned base it would sweep in every
    // earlier item's files, and from HEAD~1 only the last of this item's several round commits.
    it("VALID: {codeweaver item carrying a startRef} => the checklist is rebuilt with scope 'since-ref' over THAT sha", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const questId = QuestIdStub({ value: 'add-auth' });
      proxy.setupQuest({
        quest: QuestStub({
          baseRef: 'deadbeef' as never,
          planningNotes: { blightLedger: [] },
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
              startRef: ITEM_START_REF,
              relatedDataItems: [`operations/${OP1_ID}`],
            }),
          ],
        }),
      });
      proxy.setupWorktree({ trackedFiles: [], untrackedFiles: [] });
      proxy.setupReviewRemainder({
        dispositionedItemIds: [],
        remainingItemIds: [OUTSTANDING_UNIT_ID],
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId,
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(/signal-back refused: operationStatus 'done'/u);

      expect(proxy.getReviewChecklistCallArgs()).toStrictEqual([
        [{ questId, scope: 'since-ref', sinceRef: ITEM_START_REF }],
      ]);
    });

    it("VALID: {codeweaver item, every unit in the range dispositioned, 'done'} => the gate clears and the outcome applies", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        baseRef: 'deadbeef' as never,
        planningNotes: { blightLedger: REVIEW_LEDGER },
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
            startRef: ITEM_START_REF,
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        baseRef: 'deadbeef' as never,
        planningNotes: { blightLedger: REVIEW_LEDGER },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'complete',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'complete',
            startRef: ITEM_START_REF,
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupWorktree({ trackedFiles: [], untrackedFiles: [] });
      // A measured surface with units on it and NOTHING remaining — a fully-dispositioned round,
      // which is a different state from the unmeasurable surface the other skips produce.
      proxy.setupReviewRemainder({
        dispositionedItemIds: [DISPOSITIONED_UNIT_ID, OUTSTANDING_UNIT_ID],
        remainingItemIds: [],
      });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });

    // A round that committed nothing has nothing to review. The range is real and measured — it is
    // simply empty — so this PASSES honestly rather than being one of the skips.
    it("EMPTY: {codeweaver item whose range holds no changed files, 'done'} => accepted", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        baseRef: 'deadbeef' as never,
        planningNotes: { blightLedger: [] },
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
            startRef: ITEM_START_REF,
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        baseRef: 'deadbeef' as never,
        planningNotes: { blightLedger: [] },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'complete',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'complete',
            startRef: ITEM_START_REF,
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupWorktree({ trackedFiles: [], untrackedFiles: [] });
      proxy.setupReviewRemainder({ dispositionedItemIds: [], remainingItemIds: [] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });

    // A hydrated quest, or a work item that predates the field, has no fork point to measure from.
    // The gate never even asks for a checklist — refusing an item that could never satisfy it would
    // wedge the relay.
    it('EMPTY: {codeweaver item carrying NO startRef} => signals fine and the checklist is never measured', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        baseRef: 'deadbeef' as never,
        planningNotes: { blightLedger: [] },
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
      const questAfterOutcome = QuestStub({
        status: 'complete',
        baseRef: 'deadbeef' as never,
        planningNotes: { blightLedger: [] },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'complete',
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
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupWorktree({ trackedFiles: [], untrackedFiles: [] });
      proxy.setupReviewRemainder({
        dispositionedItemIds: [],
        remainingItemIds: [OUTSTANDING_UNIT_ID],
      });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect({
        result,
        checklistCalls: proxy.getReviewChecklistCallArgs(),
      }).toStrictEqual({ result: { success: true }, checklistCalls: [] });
    });

    // No worktree of its own — the repo-root fallback — means no checkout whose HEAD the recorded
    // sha belongs to, so there is nothing to measure `<startRef>..HEAD` in.
    it('EMPTY: {codeweaver item with a startRef but no worktree} => signals fine and the checklist is never measured', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        baseRef: 'deadbeef' as never,
        planningNotes: { blightLedger: [] },
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
            startRef: ITEM_START_REF,
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        baseRef: 'deadbeef' as never,
        planningNotes: { blightLedger: [] },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'complete',
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'complete',
            startRef: ITEM_START_REF,
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupReviewRemainder({
        dispositionedItemIds: [],
        remainingItemIds: [OUTSTANDING_UNIT_ID],
      });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect({
        result,
        checklistCalls: proxy.getReviewChecklistCallArgs(),
      }).toStrictEqual({ result: { success: true }, checklistCalls: [] });
    });

    // `since-ref` measures from the ref the CALLER names, so the quest's own pinned base is not an
    // input to this gate at all. A quest missing one is still measured — skipping there would pass
    // an unreviewed round on the strength of a field the measurement never reads.
    it("VALID: {codeweaver item with a startRef, quest with NO pinned baseRef} => still measured over 'since-ref' and refused", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const questId = QuestIdStub({ value: 'add-auth' });
      proxy.setupQuest({
        quest: QuestStub({
          planningNotes: { blightLedger: [] },
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
              startRef: ITEM_START_REF,
              relatedDataItems: [`operations/${OP1_ID}`],
            }),
          ],
        }),
      });
      proxy.setupWorktree({ trackedFiles: [], untrackedFiles: [] });
      proxy.setupReviewRemainder({
        dispositionedItemIds: [],
        remainingItemIds: [OUTSTANDING_UNIT_ID],
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId,
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(/signal-back refused: operationStatus 'done'/u);

      expect(proxy.getReviewChecklistCallArgs()).toStrictEqual([
        [{ questId, scope: 'since-ref', sinceRef: ITEM_START_REF }],
      ]);
    });

    it("VALID: {codeweaver item, every unit outstanding, 'partial'} => NOT gated, because partial is the honest escape", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        baseRef: 'deadbeef' as never,
        planningNotes: { blightLedger: [] },
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
            startRef: ITEM_START_REF,
            relatedDataItems: [`operations/${OP1_ID}`],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        baseRef: 'deadbeef' as never,
        planningNotes: { blightLedger: [] },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'complete',
            locked: false,
          }),
          OperationItemStub({
            id: CONTINUATION_UUID,
            role: 'codeweaver',
            text: 'pt 2: core: config adapter',
            status: 'pending',
            locked: false,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'complete',
            startRef: ITEM_START_REF,
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupWorktree({ trackedFiles: [], untrackedFiles: [] });
      // Every unit outstanding: what makes this a real bypass rather than a vacuously clean round.
      proxy.setupReviewRemainder({
        dispositionedItemIds: [],
        remainingItemIds: [DISPOSITIONED_UNIT_ID, OUTSTANDING_UNIT_ID],
      });
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });
      proxy.setupAdvanceUuids({ ids: [ADVANCE_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect({
        result,
        checklistCalls: proxy.getReviewChecklistCallArgs(),
      }).toStrictEqual({ result: { success: true }, checklistCalls: [] });
    });

    it("VALID: {ward item, every unit outstanding, 'done'} => NOT gated, because a command run has no reviewer round", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        baseRef: 'deadbeef' as never,
        planningNotes: { blightLedger: [] },
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
            startRef: ITEM_START_REF,
            relatedDataItems: [`operations/${OP1_ID}`],
            wardMode: 'full',
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'complete',
        baseRef: 'deadbeef' as never,
        planningNotes: { blightLedger: [] },
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
            startRef: ITEM_START_REF,
            relatedDataItems: [`operations/${OP1_ID}`],
            wardMode: 'full',
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      // Everything a gated role would be refused for — a startRef, a pinned base, a full remainder.
      // Ward passes anyway, which is what proves ROLE membership is the exclusion.
      proxy.setupReviewRemainder({
        dispositionedItemIds: [],
        remainingItemIds: [DISPOSITIONED_UNIT_ID, OUTSTANDING_UNIT_ID],
      });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect({
        result,
        checklistCalls: proxy.getReviewChecklistCallArgs(),
      }).toStrictEqual({ result: { success: true }, checklistCalls: [] });
    });
  });

  // §4.3 of the post-mortem measured a session dying ONE gate short of its commit while holding a
  // fully verified, twice-green artifact: the re-carve destroyed it, 101 minutes of wall clock for
  // 11 minutes of work, with no trace in quest.json that any of it happened. The check is "is the
  // tree clean", never "did you make a commit".
  describe('commit-before-signal gate — a code-changing role is refused while its worktree is dirty', () => {
    it.each([...REVIEWED_ROLES, ...NON_REVIEWED_COMMITTING_ROLES])(
      "ERROR: {%s item, tracked modification uncommitted, 'done'} => refused, and the message names the dirty path",
      async (role) => {
        const proxy = QuestHandleSignalBackResponderProxy();
        const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
        proxy.setupQuest({
          quest: QuestStub({
            planningNotes: { blightLedger: REVIEW_LEDGER },
            operations: [
              OperationItemStub({ id: OP1_ID, role, text: 'round one', status: 'in_progress' }),
            ],
            workItems: [
              WorkItemStub({
                id: itemId,
                role,
                status: 'in_progress',
                relatedDataItems: [`operations/${OP1_ID}`],
              }),
            ],
          }),
        });
        proxy.setupWorktree({ trackedFiles: [BLIGHT_FILE], untrackedFiles: [] });

        await expect(
          QuestHandleSignalBackResponder({
            questId: QuestIdStub({ value: 'add-auth' }),
            workItemId: itemId,
            signal: 'complete',
            operationStatus: 'done',
          }),
        ).rejects.toThrow(
          new RegExp(
            `signal-back refused: the quest worktree still carries 1 uncommitted change\\(s\\).*- ${BLIGHT_FILE}.*Commit this round`,
            'su',
          ),
        );
      },
    );

    // The case a bare `git diff` misses entirely: every net-new file a worker just wrote is
    // untracked, so a gate reading the tracked half alone comes back clean on the dirtiest tree.
    it("ERROR: {codeweaver item, ONLY untracked additions, 'done'} => refused naming the untracked path", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          planningNotes: { blightLedger: REVIEW_LEDGER },
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
        }),
      });
      proxy.setupWorktree({ trackedFiles: [], untrackedFiles: [BLIGHT_FILE] });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'done',
        }),
      ).rejects.toThrow(
        new RegExp(
          `signal-back refused: the quest worktree still carries 1 uncommitted change\\(s\\).*- ${BLIGHT_FILE}`,
          'su',
        ),
      );
    });

    // A blocked quest hands its work forward through git exactly as a finished one does, so the
    // outcome that halts is the one that most needs the work durable first.
    it("ERROR: {codeweaver item, dirty tree, 'blocked'} => refused too, and nothing is persisted", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          planningNotes: { blightLedger: REVIEW_LEDGER },
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
        }),
      });
      proxy.setupWorktree({ trackedFiles: [BLIGHT_FILE], untrackedFiles: [] });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
          operationStatus: 'blocked',
          blockedReason: BlockedReasonStub({
            value: 'the CI token this round needs is not on this machine',
          }),
        }),
      ).rejects.toThrow(
        /signal-back refused: the quest worktree still carries 1 uncommitted change/u,
      );

      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });

    it("VALID: {codeweaver item, clean worktree, 'done'} => accepted, and the git read ran inside the WORKTREE", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        planningNotes: { blightLedger: REVIEW_LEDGER },
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
      const questAfterOutcome = QuestStub({
        status: 'complete',
        planningNotes: { blightLedger: REVIEW_LEDGER },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'complete',
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
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupWorktree({ trackedFiles: [], untrackedFiles: [] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getGitSpawnedArgsList()).toStrictEqual([
        ['diff', 'HEAD', '--name-only'],
        ['ls-files', '--others', '--exclude-standard'],
      ]);
    });

    // A hydrated quest, or one seeded before worktrees, resolves to the repo root rather than a
    // worktree of its own. That is a real state, not a violation — so the gate skips entirely and
    // never reaches git, which is what the empty spawn list proves.
    it("VALID: {codeweaver item, quest with no resolvable worktree, 'done'} => accepted with no git command run at all", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        planningNotes: { blightLedger: REVIEW_LEDGER },
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
      const questAfterOutcome = QuestStub({
        status: 'complete',
        planningNotes: { blightLedger: REVIEW_LEDGER },
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'codeweaver',
            text: 'core: config adapter',
            status: 'complete',
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
      expect(proxy.getGitSpawnedArgsList()).toStrictEqual([]);
    });

    // Ward and riftcarver never call signal-back at all, and a chat role commits nothing — so
    // neither pays the git cost, which the empty spawn list is what proves.
    it("VALID: {ward item, dirty worktree staged, 'done'} => accepted, because a COMMAND role is outside the gate and never reaches git", async () => {
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
      proxy.setupWorktree({ trackedFiles: [BLIGHT_FILE], untrackedFiles: [] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'done',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getGitSpawnedArgsList()).toStrictEqual([]);
    });
  });

  describe("operationStatus 'partial' — pt continuation duplicated after the completed item", () => {
    it("VALID: {unlocked codeweaver, first 'partial'} => same persist completes the item and appends 'pt 2: <base>' directly after it", async () => {
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
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });
      proxy.setupAdvanceUuids({ ids: [ADVANCE_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        operationStatus: 'partial',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);
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
      const questAfterOutcome = QuestStub({
        operations: [op1Complete, continuation],
        workItems: [completedItem],
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
      expect(proxy.getPersistedQuestAt({ index: 0 }).operations).toStrictEqual([
        op1Complete,
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
        operations: [op1Complete, continuation],
        workItems: [completedItem],
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
      expect(proxy.getPersistedQuestAt({ index: 0 }).operations).toStrictEqual([
        op1Complete,
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
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });
      proxy.setupAdvanceUuids({ ids: [ADVANCE_UUID] });

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
      proxy.setupResponderUuids({ ids: [CONTINUATION_UUID] });
      proxy.setupAdvanceUuids({ ids: [ADVANCE_UUID] });

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
        planningNotes: { blightLedger: REVIEW_LEDGER },
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
        planningNotes: { blightLedger: REVIEW_LEDGER },
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
              role: 'siegemaster',
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
              role: 'siegemaster',
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
        // 'pt 4' continuation — a spent budget halts the quest exactly as an environment wall does.
        expect(proxy.getPersistedQuestAt({ index: 0 })).toStrictEqual(questAfterOutcome);

        const finalQuest = proxy.getLastPersistedQuest();

        // The carrier goes `failed` and carries the REASON. It used to be left `complete`, which
        // made this the one halt route with nothing to read: every row green, quest `blocked`, and
        // no `errorMessage` anywhere naming the spent chain. The environment-wall route has always
        // written its `blockedReason` onto the item for exactly this purpose, and the execution row
        // renders that field — so without it the user is told `blocked` and nothing else.
        expect({
          persistedStatuses: proxy.getAllPersistedQuests().map(({ status }) => status),
          finalWorkItems: finalQuest.workItems.map(({ id, status }) => ({ id, status })),
          carrierErrorMessages: finalQuest.workItems.map(({ errorMessage }) =>
            String(errorMessage),
          ),
          finalOperationTexts: finalQuest.operations.map(({ text }) => String(text)),
        }).toStrictEqual({
          persistedStatuses: ['in_progress', 'blocked'],
          finalWorkItems: [
            { id: itemId, status: 'failed' },
            { id: pendingId, status: 'skipped' },
          ],
          carrierErrorMessages: [
            `${role} pt chain for "verify: quest flows" is spent: 3 attempt(s) signalled 'partial' against a budget of 3. The remaining scope is on the last 'pt' operation item; a resume re-dispatches it.`,
            'undefined',
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
