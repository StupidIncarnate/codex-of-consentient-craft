import {
  BlockedReasonStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemIdStub,
  OperationItemStub,
  QuestBlightLedgerEntryStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  UnitObservationStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { agentPromptClassificationStatics } from '../../../statics/agent-prompt-classification/agent-prompt-classification-statics';
import { QuestHandleSignalBackResponder } from './quest-handle-signal-back-responder';
import { QuestHandleSignalBackResponderProxy } from './quest-handle-signal-back-responder.proxy';

const FIXED_TIMESTAMP = '2024-01-15T10:00:00.000Z';
const ITEM_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const OP1_ID = '11111111-1111-4111-8111-111111111111';
const OP2_ID = '22222222-2222-4222-8222-222222222222';
const ADVANCE_UUID = '99999999-9999-4999-8999-999999999999';

// The (fictional) changed file the sample blightLedger disposition below names.
const BLIGHT_FILE = 'packages/orchestrator/src/foo/foo-broker.ts';

// A quest fixture's review history. Spread into `planningNotes` explicitly at each site rather than
// hidden behind a default, so each quest fixture states its own history.
const REVIEW_LEDGER = [
  QuestBlightLedgerEntryStub({
    itemId: `${BLIGHT_FILE}:craft`,
    workItemId: ITEM_ID,
    createdAt: FIXED_TIMESTAMP,
  }),
];

// The five roles that run a planner/worker/reviewer round, read from the same static the responder
// reads, so a role added there is swept into the completion happy-path matrix below automatically
// instead of going untested.
const REVIEWED_ROLES = agentPromptClassificationStatics.operatorRoleNames;

// The unmarked-unit gate's fixtures below: a one-node flow whose single observable mints the real
// `<flowId>:<kind>:<localId>` unit id a fixture must use — a bare local id like `obs-3` tests a
// join that never happens in production.
const GATE_FLOW = FlowStub({
  id: 'send-flow',
  name: 'Send Flow',
  flowType: 'runtime',
  nodes: [
    FlowNodeStub({
      id: 'compose',
      label: 'Compose',
      observables: [
        FlowObservableStub({
          id: 'scan-finds-every-path',
          description: 'scanning the text finds every absolute path in the draft',
        }),
      ],
    }),
  ],
  edges: [],
});
const GATE_UNIT_ID = 'send-flow:observable:scan-finds-every-path';

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
    it('EDGE: {work item already terminal, redelivered signal} => success and zero persists', async () => {
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
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });

    it('EDGE: {linked operation already complete, work item still active} => terminalizes the item in one persist, operations untouched', async () => {
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
        status: 'in_progress',
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
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });
  });

  describe('signal-back completes the work item — one atomic persist, then advance', () => {
    // The terminal work item and its completed operation land in ONE persist, so a crash is
    // all-or-nothing, and NOTHING is appended beside them — the standards review of this commit
    // happened inside the session's own turn, via the reviewer-minion whose disposition the
    // review-coverage gate just read. Advance then mints the next work item for the pending tail.
    it('VALID: {codeweaver item, next op pending} => ONE persist completes item+operation and appends NO review item; advance creates the next work item', async () => {
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
              step: 'sweepIn',
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
      'VALID: {%s item} => the ledger gains no review operation item and the work-item list gains nothing',
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
          status: 'in_progress',
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
        });

        expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
      },
    );

    it('VALID: {ward item, ledger drained} => the work item terminates and nothing is appended, because a command run commits nothing', async () => {
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
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'ward',
            status: 'in_progress',
            spawnerType: 'command',
            relatedDataItems: [`operations/${OP1_ID}`],
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
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'ward',
            status: 'complete',
            spawnerType: 'command',
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

    it('VALID: {last operation item, no explicit ids} => operation completed in the same persist, ledger drained derives quest complete', async () => {
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

  describe('a work item running a step graph leaves its whole scope to the router', () => {
    // The scope has to still be `in_progress` when the dispatch scan next runs, or
    // questRouteScopeBroker cannot find it to route — and advance must not open the family's next
    // cell behind a scope that has finished exactly one of its steps.
    it('VALID: {codeweaver item at step `plan`, a pending cell behind it} => ONE persist terminalizes the work item alone; the operation item stays in_progress and no work item is minted', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const cell1 = OperationItemStub({
        id: OP1_ID,
        role: 'codeweaver',
        text: 'core: config adapter',
        status: 'in_progress',
      });
      const cell2 = OperationItemStub({
        id: OP2_ID,
        role: 'codeweaver',
        text: 'core: config broker',
        status: 'pending',
      });
      const quest = QuestStub({
        operations: [cell1, cell2],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'in_progress',
            relatedDataItems: [`operations/${OP1_ID}`],
            step: 'plan',
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'in_progress',
        operations: [cell1, cell2],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'codeweaver',
            status: 'complete',
            relatedDataItems: [`operations/${OP1_ID}`],
            step: 'plan',
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });
      proxy.setupAdvanceUuids({ ids: [ADVANCE_UUID] });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });
  });

  // A worker that just wrote four files reaches signal time with a dirty tree by construction —
  // nobody commits before signalling any more (see the story doc for why the gate that used to
  // check this is gone rather than scoped). What replaces it checks MARKS, not the tree.
  describe('the unmarked-unit gate — refuses before any mutation, on any role', () => {
    it('ERROR: {codeweaver item, one assigned unit with no observation} => refused, the message names the unit, and nothing is persisted', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          flows: [GATE_FLOW],
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
              assignedUnitIds: [GATE_UNIT_ID],
              observations: [],
            }),
          ],
        }),
      });

      await expect(
        QuestHandleSignalBackResponder({
          questId: QuestIdStub({ value: 'add-auth' }),
          workItemId: itemId,
          signal: 'complete',
        }),
      ).rejects.toThrow(
        new RegExp(`REFUSED: 1 of your 1 assigned units are unmarked.*${GATE_UNIT_ID}`, 'su'),
      );

      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });

    it("VALID: {codeweaver item, its one assigned unit marked 'met'} => the gate passes and the outcome applies normally", async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const quest = QuestStub({
        flows: [GATE_FLOW],
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
            assignedUnitIds: [GATE_UNIT_ID],
            observations: [UnitObservationStub({ unitId: GATE_UNIT_ID, mark: 'met' })],
          }),
        ],
      });
      const questAfterOutcome = QuestStub({
        status: 'in_progress',
        flows: [GATE_FLOW],
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
            assignedUnitIds: [GATE_UNIT_ID],
            observations: [UnitObservationStub({ unitId: GATE_UNIT_ID, mark: 'met' })],
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

    // FAILS IF the gate ran before idempotency: this terminal work item carries an assigned unit
    // with no observation, so a live gate call would throw naming it. Returning success instead is
    // the proof that idempotency short-circuits before the gate is ever reached — zero gate calls.
    it('EDGE: {work item already terminal, carries an unmarked assigned unit} => success and zero persists, because idempotency runs before the gate', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      proxy.setupQuest({
        quest: QuestStub({
          flows: [GATE_FLOW],
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
              assignedUnitIds: [GATE_UNIT_ID],
              observations: [],
              completedAt: FIXED_TIMESTAMP,
              actualSignal: 'complete',
            }),
          ],
        }),
      });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([]);
    });
  });

  describe('blockedReason rides onto the terminal work item as errorMessage', () => {
    it('VALID: {ward item, blockedReason present} => the item still completes, carrying the reason as errorMessage', async () => {
      const proxy = QuestHandleSignalBackResponderProxy();
      const itemId = QuestWorkItemIdStub({ value: ITEM_ID });
      const blockedReason = BlockedReasonStub({
        value: 'git commit is denied in this dispatched session',
      });
      const quest = QuestStub({
        operations: [
          OperationItemStub({
            id: OP1_ID,
            role: 'ward',
            text: 'Ward gate (full monorepo)',
            status: 'in_progress',
            locked: true,
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'ward',
            status: 'in_progress',
            spawnerType: 'command',
            relatedDataItems: [`operations/${OP1_ID}`],
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
          }),
        ],
        workItems: [
          WorkItemStub({
            id: itemId,
            role: 'ward',
            status: 'complete',
            spawnerType: 'command',
            relatedDataItems: [`operations/${OP1_ID}`],
            completedAt: FIXED_TIMESTAMP,
            actualSignal: 'complete',
            errorMessage: 'git commit is denied in this dispatched session',
          }),
        ],
        updatedAt: FIXED_TIMESTAMP,
      });
      proxy.setupSignalFlow({ quest, questAfterOutcome });

      const result = await QuestHandleSignalBackResponder({
        questId: QuestIdStub({ value: 'add-auth' }),
        workItemId: itemId,
        signal: 'complete',
        blockedReason,
      });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getAllPersistedQuests()).toStrictEqual([questAfterOutcome]);
    });
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
        status: 'in_progress',
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
});
