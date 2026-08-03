import {
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  ModifyQuestInputStub,
  OperationItemStub,
  PlanningBlightReportStub,
  QuestBlightLedgerEntryStub,
  QuestCommentStub,
  QuestQaLedgerEntryStub,
  QuestStub,
  ToolingRequirementStub,
  WardResultStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { questModifyBroker } from './quest-modify-broker';
import { questModifyBrokerProxy } from './quest-modify-broker.proxy';

type PersistedQuest = ReturnType<typeof QuestStub>;

const parseLatestPersisted = (persisted: readonly unknown[]): PersistedQuest => {
  const raw = persisted[persisted.length - 1];
  const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return QuestStub(parsed as Parameters<typeof QuestStub>[0]);
};

describe('questModifyBroker', () => {
  describe('successful modification', () => {
    it('VALID: {questId, contracts: [new]} => adds new contract', async () => {
      const proxy = questModifyBrokerProxy();
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [FlowNodeStub({ id: 'submit-form' as never })],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [flow],
        contracts: [],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        contracts: [
          {
            id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
            name: 'LoginCredentials',
            kind: 'data',
            status: 'new',
            source: 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts',
            nodeId: 'submit-form',
            properties: [
              {
                name: 'email',
                type: 'EmailAddress',
                description: 'User email for authentication',
              },
            ],
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, designDecisions: [new]} => adds new design decision', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_flows',
        designDecisions: [],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        designDecisions: [
          {
            id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
            title: 'Use JWT for auth',
            rationale: 'Stateless authentication',
            relatedNodeIds: [],
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, flows: [new]} => adds new flow', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_flows',
        flows: [],
      });

      proxy.setupQuestFound({ quest });

      const flow = FlowStub();
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        flows: [flow],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, flows: [new flow with node lacking observables key]} during explore_flows => succeeds and persists node with observables: []', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_flows',
        flows: [],
      });

      proxy.setupQuestFound({ quest });

      // New flow with a node that has NO observables key in the input payload.
      // The MCP modifyQuestInputContract makes node.observables `.optional()` (overriding
      // the contract's `.default([])`), so this lands as `observables: undefined` after parse.
      // Without a re-parse before invariants, downstream offender finders trip
      // "node.observables is not iterable".
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        flows: [
          {
            id: 'login-flow' as never,
            name: 'Login Flow' as never,
            flowType: 'runtime' as never,
            entryPoint: '/login' as never,
            exitPoints: ['/dashboard'] as never,
            nodes: [
              {
                id: 'submit-form' as never,
                label: 'Submit Form' as never,
                type: 'state' as never,
                // observables key intentionally OMITTED
              },
            ],
            edges: [],
          },
        ] as never,
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.flows[0]?.nodes[0]?.observables).toStrictEqual([]);
    });

    it('VALID: {questId, status: "explore_flows"} with quest at "created" => sets status on quest', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'created',
        flows: [FlowStub()],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'explore_flows',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, status: "explore_observables"} with quest at "flows_approved" => sets status on quest', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [FlowStub()],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'explore_observables',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId, title} => updates quest title', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_flows',
        title: 'Old Title',
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        title: 'New Title',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {questId only} => updates updatedAt', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({ questId: 'add-auth' });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });
  });

  describe('operations ledger upsert (Tier 2 scoped to explore_observables)', () => {
    it('VALID: {questId, operations: [new]} => adds new operation item', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_observables',
        operations: [],
      });

      proxy.setupQuestFound({ quest });

      const newOperation = OperationItemStub();
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        operations: [newOperation],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.operations).toStrictEqual([newOperation]);
    });

    it('VALID: {questId, operations: [partial patch]} => merges only the changed field, preserves siblings (partial-patch safety)', async () => {
      const proxy = questModifyBrokerProxy();
      const existingOperation = OperationItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d201',
        role: 'ward',
        text: 'ward: run changed-mode check',
        status: 'pending',
        locked: false,
        wardMode: 'changed',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_observables',
        operations: [existingOperation],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        operations: [{ id: existingOperation.id, status: 'in_progress' } as never],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.operations).toStrictEqual([{ ...existingOperation, status: 'in_progress' }]);
    });

    it('VALID: {questId, operations: [delete unlocked]} => removes matching entry', async () => {
      const proxy = questModifyBrokerProxy();
      const keepOperation = OperationItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d301',
        role: 'codeweaver',
        locked: false,
      });
      const deleteOperation = OperationItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d302',
        role: 'ward',
        locked: false,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_observables',
        operations: [keepOperation, deleteOperation],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        operations: [{ id: deleteOperation.id, _delete: true } as never],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.operations).toStrictEqual([keepOperation]);
    });

    it('INVALID: {questId, operations: [delete locked]} => rejects with Locked Operation Item failedCheck; nothing persisted', async () => {
      const proxy = questModifyBrokerProxy();
      const lockedOperation = OperationItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d401',
        role: 'ward',
        locked: true,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_observables',
        operations: [lockedOperation],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        operations: [{ id: lockedOperation.id, _delete: true } as never],
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Locked operation items cannot be deleted',
        failedChecks: [
          {
            name: 'Locked Operation Item',
            passed: false,
            details: `Operation item '${lockedOperation.id}' is locked and cannot be deleted`,
          },
        ],
      });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });

  describe('duplicate sibling ids (Tier 1, rejected before quest load)', () => {
    it('INVALID: {designDecisions: two entries sharing the same id in one payload} => rejects with the duplicate-id message; quest is never looked up', async () => {
      const proxy = questModifyBrokerProxy();

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        designDecisions: [
          {
            id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
            title: 'First title',
            rationale: 'First rationale',
            relatedNodeIds: [],
          },
          {
            id: 'c23bc10b-58cc-4372-a567-0e02b2c3d479',
            title: 'Second title',
            rationale: 'Second rationale',
            relatedNodeIds: [],
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error:
          'Duplicate ID "c23bc10b-58cc-4372-a567-0e02b2c3d479" in designDecisions — this ID already exists. Use a unique ID or omit to leave existing unchanged.',
      });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });

  describe('quest not found', () => {
    it('ERROR: {questId not exists} => returns not found error', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth' });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({ questId: 'nonexistent' });
      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Quest with id "nonexistent" not found in any guild',
      });
    });

    it('ERROR: {empty folder} => returns not found error', async () => {
      const proxy = questModifyBrokerProxy();

      proxy.setupEmptyFolder();

      const input = ModifyQuestInputStub({ questId: 'any-quest' });
      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Quest with id "any-quest" not found in any guild',
      });
    });
  });

  describe('invalid status transitions', () => {
    it('ERROR: {status: "approved"} with quest at "created" => returns invalid transition error', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', status: 'created' });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'approved',
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Invalid status transition: created -> approved',
      });
    });

    it('ERROR: {status: "in_progress"} with quest at "created" => returns invalid transition error', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({ id: 'add-auth', folder: '001-add-auth', status: 'created' });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'in_progress',
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Invalid status transition: created -> in_progress',
      });
    });
  });

  describe('missing gate content', () => {
    it('ERROR: {status: "flows_approved"} with empty flows => returns missing content error', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'review_flows',
        flows: [],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'flows_approved',
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Missing required content for transition to flows_approved',
      });
    });

    it('ERROR: {status: "approved"} with empty flows => returns missing content error', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'review_observables',
        flows: [],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'approved',
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Missing required content for transition to approved',
      });
    });

    it('ERROR: {status: "approved"} with flows present but no codeweaver operation item (feature quest) => returns missing content error', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'review_observables',
        flows: [FlowStub()],
        operations: [],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'approved',
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Missing required content for transition to approved',
      });
    });
  });

  describe('input allowlist rejection (Tier 2)', () => {
    it('INVALID: {operations during explore_flows} => returns failedChecks rejecting operations field', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_flows',
        flows: [FlowStub()],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        operations: [OperationItemStub()],
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Field(s) not allowed in status explore_flows',
        failedChecks: [
          {
            name: 'Input Allowlist',
            passed: false,
            details: "Field 'operations' not allowed in status 'explore_flows'",
          },
        ],
      });
    });

    it('INVALID: {operations during in_progress} => returns failedChecks rejecting operations field (runtime writes go through questOperationsUpdateBroker, not modify-quest)', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        operations: [OperationItemStub()],
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Field(s) not allowed in status in_progress',
        failedChecks: [
          {
            name: 'Input Allowlist',
            passed: false,
            details: "Field 'operations' not allowed in status 'in_progress'",
          },
        ],
      });
    });
  });

  describe('save-invariants rejection (Tier 3)', () => {
    it('INVALID: {flows with duplicate ids in stored quest} => returns failedChecks; nothing persisted', async () => {
      const proxy = questModifyBrokerProxy();
      const existingFlow = FlowStub({ id: 'login-flow' as never });
      const conflictingFlow = FlowStub({
        id: 'login-flow' as never,
        name: 'Conflicting Flow' as never,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [existingFlow, conflictingFlow],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({ questId: 'add-auth' });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Save invariants failed',
        failedChecks: [
          {
            name: 'Flow ID Uniqueness',
            passed: false,
            details: 'Duplicate flow ids: login-flow',
          },
        ],
      });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });

  describe('Tier 4 completeness checks removed (regression)', () => {
    it('VALID: {status: "review_flows" with orphan flow node} => transitions successfully (completeness checks no longer gate transitions)', async () => {
      const proxy = questModifyBrokerProxy();
      const orphanNode = FlowNodeStub({ id: 'orphan-node' as never });
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [orphanNode],
        edges: [],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_flows',
        flows: [flow],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'review_flows',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });
  });

  describe('planningNotes.qaLedger handling', () => {
    it('VALID: {planningNotes.qaLedger with a new itemId} => the disposition is persisted', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [], qaLedger: [] },
      });

      proxy.setupQuestFound({ quest });

      const entry = QuestQaLedgerEntryStub({
        itemId: 'login-flow:observable:check-redirect' as never,
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { qaLedger: [entry] },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({
        blightReports: [],
        qaLedger: [entry],
        blightLedger: [],
      });
    });

    it('VALID: {planningNotes.qaLedger re-dispositioning an existing itemId} => replaces that entry rather than appending a second', async () => {
      const proxy = questModifyBrokerProxy();
      const original = QuestQaLedgerEntryStub({
        itemId: 'login-flow:observable:check-redirect' as never,
        disposition: 'gap',
        evidence: 'no browser attached on that pass' as never,
      });
      const untouched = QuestQaLedgerEntryStub({
        itemId: 'login-flow:terminal:logged-in' as never,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [], qaLedger: [original, untouched] },
      });

      proxy.setupQuestFound({ quest });

      const corrected = QuestQaLedgerEntryStub({
        itemId: 'login-flow:observable:check-redirect' as never,
        disposition: 'walked',
        evidence: 'the browser landed on /dashboard' as never,
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { qaLedger: [corrected] },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({
        blightReports: [],
        qaLedger: [untouched, corrected],
        blightLedger: [],
      });
    });

    it('EDGE: {planningNotes.qaLedger: []} with a non-empty existing ledger => leaves existing entries untouched (empty payload does not wipe)', async () => {
      const proxy = questModifyBrokerProxy();
      const existingEntry = QuestQaLedgerEntryStub({
        itemId: 'login-flow:observable:check-redirect' as never,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [], qaLedger: [existingEntry] },
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { qaLedger: [] },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({
        blightReports: [],
        qaLedger: [existingEntry],
        blightLedger: [],
      });
    });

    it('VALID: {planningNotes.blightReports and planningNotes.qaLedger both changing in one call} => both merges land, neither clobbers the other', async () => {
      const proxy = questModifyBrokerProxy();
      const existingReport = PlanningBlightReportStub({
        id: '11111111-1111-4111-8111-111111111111' as never,
        minion: 'security',
      });
      const existingEntry = QuestQaLedgerEntryStub({
        itemId: 'login-flow:terminal:logged-in' as never,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [existingReport], qaLedger: [existingEntry] },
      });

      proxy.setupQuestFound({ quest });

      const newReport = PlanningBlightReportStub({
        id: '22222222-2222-4222-8222-222222222222' as never,
        minion: 'dedup',
      });
      const newEntry = QuestQaLedgerEntryStub({
        itemId: 'login-flow:observable:check-redirect' as never,
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { blightReports: [newReport], qaLedger: [newEntry] },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({
        blightReports: [existingReport, newReport],
        qaLedger: [existingEntry, newEntry],
        blightLedger: [],
      });
    });

    it('VALID: {planningNotes: {}} with neither blightReports nor qaLedger => leaves existing planningNotes untouched', async () => {
      const proxy = questModifyBrokerProxy();
      const existingReport = PlanningBlightReportStub({
        id: '11111111-1111-4111-8111-111111111111' as never,
        minion: 'security',
      });
      const existingEntry = QuestQaLedgerEntryStub({
        itemId: 'login-flow:terminal:logged-in' as never,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [existingReport], qaLedger: [existingEntry] },
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: {},
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({
        blightReports: [existingReport],
        qaLedger: [existingEntry],
        blightLedger: [],
      });
    });
  });

  describe('planningNotes.qaLedger duplicate collapsing', () => {
    it('EDGE: {two dispositions for the same itemId in ONE payload} => only the last survives', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [], qaLedger: [] },
      });

      proxy.setupQuestFound({ quest });

      const first = QuestQaLedgerEntryStub({
        itemId: 'login-flow:observable:check-redirect' as never,
        disposition: 'gap',
        evidence: 'superseded within the same payload' as never,
      });
      const last = QuestQaLedgerEntryStub({
        itemId: 'login-flow:observable:check-redirect' as never,
        disposition: 'walked',
        evidence: 'the browser landed on /dashboard' as never,
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { qaLedger: [first, last] },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({
        blightReports: [],
        qaLedger: [last],
        blightLedger: [],
      });
    });
  });

  describe('planningNotes.blightLedger handling', () => {
    it('VALID: {planningNotes.blightLedger with a new itemId} => the disposition is persisted', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [], qaLedger: [], blightLedger: [] },
      });

      proxy.setupQuestFound({ quest });

      const entry = QuestBlightLedgerEntryStub({
        itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:coverage' as never,
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { blightLedger: [entry] },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({
        blightReports: [],
        qaLedger: [],
        blightLedger: [entry],
      });
    });

    it('VALID: {planningNotes.blightLedger re-dispositioning an existing itemId} => replaces that entry rather than appending a second, leaving exactly one entry for that itemId', async () => {
      const proxy = questModifyBrokerProxy();
      const original = QuestBlightLedgerEntryStub({
        itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:coverage' as never,
        disposition: 'gap',
        evidence: 'no test file existed on that pass' as never,
      });
      const untouched = QuestBlightLedgerEntryStub({
        itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:security' as never,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [], qaLedger: [], blightLedger: [original, untouched] },
      });

      proxy.setupQuestFound({ quest });

      const corrected = QuestBlightLedgerEntryStub({
        itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:coverage' as never,
        disposition: 'reviewed',
        evidence: 'quest-chat-widget.test.tsx now covers every branch in handleSubmit' as never,
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { blightLedger: [corrected] },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({
        blightReports: [],
        qaLedger: [],
        blightLedger: [untouched, corrected],
      });
    });

    it('EDGE: {two dispositions for the same itemId in ONE payload} => only the last survives', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [], qaLedger: [], blightLedger: [] },
      });

      proxy.setupQuestFound({ quest });

      const first = QuestBlightLedgerEntryStub({
        itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:coverage' as never,
        disposition: 'gap',
        evidence: 'superseded within the same payload' as never,
      });
      const last = QuestBlightLedgerEntryStub({
        itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:coverage' as never,
        disposition: 'reviewed',
        evidence: 'every branch in handleSubmit has a test' as never,
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { blightLedger: [first, last] },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({
        blightReports: [],
        qaLedger: [],
        blightLedger: [last],
      });
    });

    it('EDGE: {planningNotes.blightLedger: []} with a non-empty existing ledger => leaves existing entries untouched (empty payload does not wipe)', async () => {
      const proxy = questModifyBrokerProxy();
      const existingEntry = QuestBlightLedgerEntryStub({
        itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:coverage' as never,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [], qaLedger: [], blightLedger: [existingEntry] },
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { blightLedger: [] },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({
        blightReports: [],
        qaLedger: [],
        blightLedger: [existingEntry],
      });
    });

    it('VALID: {planningNotes.blightLedger write at in_progress} => accepted by the per-status input allowlist', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [], qaLedger: [], blightLedger: [] },
      });

      proxy.setupQuestFound({ quest });

      const entry = QuestBlightLedgerEntryStub({
        itemId: 'packages/web/src/widgets/quest-chat/quest-chat-widget.tsx:coverage' as never,
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { blightLedger: [entry] },
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('planningNotes handling (blightReports only)', () => {
    it('VALID: {planningNotes.blightReports with two distinct UUIDs} => both entries land via upsert', async () => {
      const proxy = questModifyBrokerProxy();
      const existingReport = PlanningBlightReportStub({
        id: '11111111-1111-4111-8111-111111111111' as never,
        minion: 'security',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [existingReport], qaLedger: [] },
      });

      proxy.setupQuestFound({ quest });

      const newReport = PlanningBlightReportStub({
        id: '22222222-2222-4222-8222-222222222222' as never,
        minion: 'dedup',
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { blightReports: [newReport], qaLedger: [] },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({
        blightReports: [existingReport, newReport],
        qaLedger: [],
        blightLedger: [],
      });
    });

    it('VALID: {planningNotes.blightReports with existing UUID} => deep-merges (overwrites matching id)', async () => {
      const proxy = questModifyBrokerProxy();
      const sameId = '11111111-1111-4111-8111-111111111111' as never;
      const existingReport = PlanningBlightReportStub({
        id: sameId,
        minion: 'security',
        status: 'active',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [existingReport], qaLedger: [] },
      });

      proxy.setupQuestFound({ quest });

      const updatedReport = PlanningBlightReportStub({
        id: sameId,
        minion: 'security',
        status: 'resolved',
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { blightReports: [updatedReport], qaLedger: [] },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({
        blightReports: [updatedReport],
        qaLedger: [],
        blightLedger: [],
      });
    });

    it('VALID: {planningNotes.blightReports with _delete: true} => removes matching entry', async () => {
      const proxy = questModifyBrokerProxy();
      const keepId = '11111111-1111-4111-8111-111111111111' as never;
      const deleteId = '22222222-2222-4222-8222-222222222222' as never;
      const keepReport = PlanningBlightReportStub({ id: keepId, minion: 'security' });
      const deleteReport = PlanningBlightReportStub({ id: deleteId, minion: 'dedup' });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [keepReport, deleteReport], qaLedger: [] },
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { blightReports: [{ id: deleteId, _delete: true } as never], qaLedger: [] },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({
        blightReports: [keepReport],
        qaLedger: [],
        blightLedger: [],
      });
    });
  });

  describe('toolingRequirements upsert', () => {
    it('VALID: {questId, toolingRequirements: [new]} => adds new tooling requirement', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_observables',
        toolingRequirements: [],
      });

      proxy.setupQuestFound({ quest });

      const newRequirement = ToolingRequirementStub();
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        toolingRequirements: [newRequirement],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.toolingRequirements).toStrictEqual([newRequirement]);
    });

    it('VALID: {questId, toolingRequirements: [partial patch]} => merges only the changed field, preserves siblings', async () => {
      const proxy = questModifyBrokerProxy();
      const existingRequirement = ToolingRequirementStub({
        id: 'pg-driver',
        name: 'Postgres Driver',
        packageName: 'pg',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_observables',
        toolingRequirements: [existingRequirement],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        toolingRequirements: [{ id: existingRequirement.id, name: 'Postgres Driver v2' } as never],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.toolingRequirements).toStrictEqual([
        { ...existingRequirement, name: 'Postgres Driver v2' },
      ]);
    });
  });

  describe('wardResults upsert (server-only field, bypasses the input allowlist)', () => {
    it('VALID: {questId, wardResults: [new]} => adds new ward result entry', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        wardResults: [],
      });

      proxy.setupQuestFound({ quest });

      const newResult = WardResultStub();
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        wardResults: [newResult],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.wardResults).toStrictEqual([newResult]);
    });
  });

  describe('packagesAffected handling (replace-not-upsert)', () => {
    it('VALID: {packagesAffected: [new list]} => replaces the whole array rather than upserting by id', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_observables',
        packagesAffected: ['shared'],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        packagesAffected: ['orchestrator', 'mcp'],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.packagesAffected).toStrictEqual(['orchestrator', 'mcp']);
    });

    it('VALID: {no packagesAffected in input} => leaves the existing array unchanged', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_observables',
        packagesAffected: ['shared'],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({ questId: 'add-auth' });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.packagesAffected).toStrictEqual(['shared']);
    });
  });

  describe('designPort handling (orchestrator-only field)', () => {
    it('VALID: {designPort: 5173} => sets quest.designPort', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        designPort: 5173,
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.designPort).toBe(5173);
    });

    it('VALID: {no designPort in input} => leaves quest.designPort unchanged', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        designPort: 4173,
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({ questId: 'add-auth' });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.designPort).toBe(4173);
    });
  });

  describe('mutex behavior (concurrency safety)', () => {
    it('VALID: {10 concurrent modify calls on same questId} => all 10 persist calls complete (serialized, none dropped)', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [], qaLedger: [] },
      });

      // Queue 10 quest-file responses so each of the 10 serialized modify calls has a load result
      Array.from({ length: 10 }).forEach(() => {
        proxy.setupQuestFound({ quest });
      });

      const reportIds = Array.from(
        { length: 10 },
        (_, index) => `${String(index).padStart(8, '0')}-1111-4111-8111-111111111111`,
      );

      const calls = reportIds.map(async (uuid) => {
        const report = PlanningBlightReportStub({
          id: uuid as never,
          minion: 'security',
        });
        const input = ModifyQuestInputStub({
          questId: 'add-auth',
          planningNotes: { blightReports: [report], qaLedger: [] },
        });
        return questModifyBroker({ input });
      });

      const results = await Promise.all(calls);

      expect(results.map((r) => r.success)).toStrictEqual([
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
        true,
      ]);

      // One persist call per modify call, and each call's OWN report reached disk — mutex
      // serializes the calls so none are dropped, and none overwrite a sibling's write.
      const persisted = proxy.getAllPersistedContents();
      const persistedReportIds = persisted
        .map((raw) => parseLatestPersisted([raw]).planningNotes.blightReports[0]!.id)
        .sort();

      expect(persistedReportIds).toStrictEqual([...reportIds].sort());
    });

    it('VALID: {concurrent modify calls on different questIds} => both succeed independently', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [], qaLedger: [] },
      });

      // Queue two load responses — one per concurrent call.
      proxy.setupQuestFound({ quest });
      proxy.setupQuestFound({ quest });

      const reportA = PlanningBlightReportStub({
        id: 'aaaaaaaa-1111-4111-8111-111111111111' as never,
        minion: 'security',
      });
      const reportB = PlanningBlightReportStub({
        id: 'bbbbbbbb-2222-4222-8222-222222222222' as never,
        minion: 'dedup',
      });

      const inputA = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { blightReports: [reportA], qaLedger: [] },
      });
      const inputB = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { blightReports: [reportB], qaLedger: [] },
      });

      const [resultA, resultB] = await Promise.all([
        questModifyBroker({ input: inputA }),
        questModifyBroker({ input: inputB }),
      ]);

      expect(resultA.success).toBe(true);
      expect(resultB.success).toBe(true);
    });
  });

  describe('pausedAtStatus handling (orchestrator-only field)', () => {
    it('VALID: {pausedAtStatus: "explore_flows"} => sets quest.pausedAtStatus to "explore_flows"', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        pausedAtStatus: 'explore_flows',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.pausedAtStatus).toBe('explore_flows');
    });

    it('VALID: {pausedAtStatus: "in_progress", status: "paused"} => sets pausedAtStatus and transitions status', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'paused',
        pausedAtStatus: 'in_progress',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect({
        status: persisted.status,
        pausedAtStatus: persisted.pausedAtStatus,
      }).toStrictEqual({
        status: 'paused',
        pausedAtStatus: 'in_progress',
      });
    });

    it('VALID: {no pausedAtStatus in input} => leaves quest.pausedAtStatus unchanged', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'paused',
        pausedAtStatus: 'explore_flows',
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.pausedAtStatus).toBe('explore_flows');
    });

    it('VALID: {pausedAtStatus: null, status: "explore_flows"} => clears quest.pausedAtStatus from the record', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'paused',
        pausedAtStatus: 'explore_flows',
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'explore_flows',
        pausedAtStatus: null,
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persistedContents = proxy.getAllPersistedContents();
      const latestRaw = persistedContents[persistedContents.length - 1];
      const parsedRaw = JSON.parse(String(latestRaw)) as Record<PropertyKey, unknown>;

      expect('pausedAtStatus' in parsedRaw).toBe(false);
      expect(parsedRaw.status).toBe('explore_flows');
    });
  });

  describe('work-item-driven status derivation', () => {
    it('VALID: {workItems: [complete last item], no status} with all others already complete => persisted quest.status is "complete"', async () => {
      const proxy = questModifyBrokerProxy();
      const item1 = WorkItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d001',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [],
      });
      const item2 = WorkItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d002',
        role: 'ward',
        spawnerType: 'command',
        status: 'pending',
        dependsOn: [item1.id],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        workItems: [item1, item2],
      });

      proxy.setupQuestFound({ quest });

      // Complete the last pending item — no explicit status passed
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        workItems: [{ id: item2.id, status: 'complete' }],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.status).toBe('complete');
    });

    it('VALID: {explicit status: "blocked", workItems present} => explicit status wins, derivation does NOT override to in_progress', async () => {
      const proxy = questModifyBrokerProxy();
      const item1 = WorkItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d003',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [],
      });
      const item2 = WorkItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d004',
        role: 'ward',
        spawnerType: 'command',
        status: 'pending',
        dependsOn: [],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        workItems: [item1, item2],
      });

      proxy.setupQuestFound({ quest });

      // Explicit status: 'blocked' is passed alongside workItems
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'blocked',
        workItems: [{ id: item2.id, status: 'skipped' }],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.status).toBe('blocked');
    });

    it('VALID: {workItems: [mark one item running], no status} with another item still pending => persisted quest.status stays "in_progress" (non-complete derivation does not clobber status)', async () => {
      const proxy = questModifyBrokerProxy();
      const item1 = WorkItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d005',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [],
      });
      const item2 = WorkItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d006',
        role: 'ward',
        spawnerType: 'command',
        status: 'pending',
        dependsOn: [item1.id],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        workItems: [item1, item2],
      });

      proxy.setupQuestFound({ quest });

      // Mark item2 as in_progress — still active, not complete.
      // Derived status would be 'in_progress' (non-complete); quest.status must remain unchanged.
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        workItems: [{ id: item2.id, status: 'in_progress' }],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.status).toBe('in_progress');
    });

    it('EDGE: {workItems: [mark ward failed], no status} where only downstream item depends on failed ward => persisted quest.status stays "in_progress" (premature blocked derivation is suppressed)', async () => {
      const proxy = questModifyBrokerProxy();
      const wardItem = WorkItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d007',
        role: 'ward',
        spawnerType: 'command',
        status: 'in_progress',
        dependsOn: [],
      });
      const downstreamItem = WorkItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d008',
        role: 'spiritmender',
        status: 'pending',
        dependsOn: [wardItem.id],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        workItems: [wardItem, downstreamItem],
      });

      proxy.setupQuestFound({ quest });

      // Mark ward as failed — workItems-only write, no explicit status.
      // The transformer derives 'blocked' because downstreamItem depends on the failed wardItem,
      // but the bare-workItems branch does not apply a derived 'blocked' — that status is owned by
      // the explicit failure-routing path. So quest.status stays 'in_progress' and the recovery
      // splice (the next write) can reopen it without a blocked flicker.
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        workItems: [{ id: wardItem.id, status: 'failed' }],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.status).toBe('in_progress');
    });

    it('EDGE: {workItems: [complete last item], operations: [pending item]}, no status => persisted quest.status stays "in_progress" (pending operation blocks complete derivation)', async () => {
      const proxy = questModifyBrokerProxy();
      const item1 = WorkItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d009',
        role: 'codeweaver',
        status: 'complete',
        dependsOn: [],
      });
      const item2 = WorkItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d010',
        role: 'ward',
        spawnerType: 'command',
        status: 'pending',
        dependsOn: [item1.id],
      });
      const pendingOperation = OperationItemStub({
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d011',
        status: 'pending',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        workItems: [item1, item2],
        operations: [pendingOperation],
      });

      proxy.setupQuestFound({ quest });

      // Complete the last pending work item — every work item is now terminal, but the
      // operations ledger still has a pending entry, so derivation must NOT jump to 'complete'.
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        workItems: [{ id: item2.id, status: 'complete' }],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.status).toBe('in_progress');
    });
  });

  describe('contract source path resolution (DET3)', () => {
    it('INVALID: {contracts: [new] but source already resolves on disk} => returns Contract Source Resolution failedCheck', async () => {
      const proxy = questModifyBrokerProxy();
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [FlowNodeStub({ id: 'submit-form' as never })],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [flow],
        contracts: [],
      });

      proxy.setupQuestFound({ quest });
      // Force fs.access to succeed once so the validator sees the new contract's
      // source as "already exists on disk" — which is the rejection path.
      proxy.setupContractSourceResolvesOnce({
        source: 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts',
      });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        contracts: [
          {
            id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
            name: 'LoginCredentials',
            kind: 'data',
            status: 'new',
            source: 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts',
            nodeId: 'submit-form',
            properties: [
              {
                name: 'email',
                type: 'EmailAddress',
                description: 'User email for authentication',
              },
            ],
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Contract source path resolution failed',
        failedChecks: [
          {
            name: 'Contract Source Resolution',
            passed: false,
            details:
              "Contract 'LoginCredentials' has status 'new' but source 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts' already resolves on disk. Set status to 'existing' or 'modified', change the source path, or drop the entry.",
          },
        ],
      });
    });

    it('INVALID: {contracts: [existing] but source does not resolve on disk} => returns Contract Source Resolution failedCheck', async () => {
      const proxy = questModifyBrokerProxy();
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [FlowNodeStub({ id: 'submit-form' as never })],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [flow],
        contracts: [],
      });

      proxy.setupQuestFound({ quest });
      // Default fs.access is "not found" — we do NOT call
      // setupContractSourceResolvesOnce, so an 'existing' contract's source path
      // appears missing on disk (the rejection path).

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        contracts: [
          {
            id: 'b47bc10b-58cc-4372-a567-0e02b2c3d479',
            name: 'EmailAddress',
            kind: 'data',
            status: 'existing',
            source: 'packages/shared/src/contracts/missing-thing/missing-thing-contract.ts',
            nodeId: 'submit-form',
            properties: [
              {
                name: 'value',
                type: 'EmailAddress',
                description: 'Email value',
              },
            ],
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Contract source path resolution failed',
        failedChecks: [
          {
            name: 'Contract Source Resolution',
            passed: false,
            details:
              "Contract 'EmailAddress' has status 'existing' but source 'packages/shared/src/contracts/missing-thing/missing-thing-contract.ts' does not resolve on disk. Set status to 'new', or correct the source path.",
          },
        ],
      });
    });

    it('INVALID: {contracts: [new] with an already-absolute source path that already resolves on disk} => returns Contract Source Resolution failedCheck without prepending "./" (absolute-path branch)', async () => {
      const proxy = questModifyBrokerProxy();
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [FlowNodeStub({ id: 'submit-form' as never })],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [flow],
        contracts: [],
      });

      proxy.setupQuestFound({ quest });
      proxy.setupContractSourceResolvesOnce({
        source:
          '/abs/packages/shared/src/contracts/login-credentials/login-credentials-contract.ts',
      });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        contracts: [
          {
            id: 'a47bc10b-58cc-4372-a567-0e02b2c3d479',
            name: 'LoginCredentials',
            kind: 'data',
            status: 'new',
            source:
              '/abs/packages/shared/src/contracts/login-credentials/login-credentials-contract.ts',
            nodeId: 'submit-form',
            properties: [
              {
                name: 'email',
                type: 'EmailAddress',
                description: 'User email for authentication',
              },
            ],
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Contract source path resolution failed',
        failedChecks: [
          {
            name: 'Contract Source Resolution',
            passed: false,
            details:
              "Contract 'LoginCredentials' has status 'new' but source '/abs/packages/shared/src/contracts/login-credentials/login-credentials-contract.ts' already resolves on disk. Set status to 'existing' or 'modified', change the source path, or drop the entry.",
          },
        ],
      });
    });

    it('VALID: {contracts: [existing] with source that resolves on disk} => succeeds (path-disk consistency holds)', async () => {
      const proxy = questModifyBrokerProxy();
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [FlowNodeStub({ id: 'submit-form' as never })],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [flow],
        contracts: [],
      });

      proxy.setupQuestFound({ quest });
      proxy.setupContractSourceResolvesOnce({
        source: 'packages/shared/src/contracts/email-address/email-address-contract.ts',
      });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        contracts: [
          {
            id: 'c47bc10b-58cc-4372-a567-0e02b2c3d479',
            name: 'EmailAddress',
            kind: 'data',
            status: 'existing',
            source: 'packages/shared/src/contracts/email-address/email-address-contract.ts',
            nodeId: 'submit-form',
            properties: [
              {
                name: 'value',
                type: 'EmailAddress',
                description: 'Email value',
              },
            ],
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });
  });

  describe('valid transition passes all tiers', () => {
    it('VALID: {explore_flows -> review_flows} => transitions and persists', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_flows',
        flows: [FlowStub()],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'review_flows',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {review_flows -> flows_approved} with non-empty flows => transitions and persists', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'review_flows',
        flows: [FlowStub()],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'flows_approved',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {review_observables -> approved} with flows and a codeweaver operation item (feature quest) => transitions and persists', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'review_observables',
        flows: [FlowStub()],
        operations: [OperationItemStub({ role: 'codeweaver' })],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'approved',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {review_observables -> approved} for a bug-hunt quest with empty operations => transitions and persists (operations requirement skipped for non-feature quests)', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'review_observables',
        questType: 'bug-hunt',
        flows: [FlowStub()],
        operations: [],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'approved',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {approved -> in_progress} => transitions and persists', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'approved',
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'in_progress',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('VALID: {design_approved -> in_progress} => transitions and persists', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'design_approved',
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'in_progress',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });
  });

  describe('comment persistence and orphan cleanup', () => {
    it('VALID: {comments: [new comment anchored to existing node], status: review_flows} => comment reaches persisted quest.comments', async () => {
      const proxy = questModifyBrokerProxy();
      const node = FlowNodeStub({ id: 'submit-form' as never });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node], edges: [] });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'review_flows',
        flows: [flow],
        comments: [],
      });

      proxy.setupQuestFound({ quest });

      const comment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d001' as never,
        flowId: 'login-flow' as never,
        nodeId: 'submit-form' as never,
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        comments: [comment],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.comments).toStrictEqual([comment]);
    });

    it('VALID: {comments: [second comment]} on a node that already carries one => persisted comments are first then second, both intact', async () => {
      const proxy = questModifyBrokerProxy();
      const node = FlowNodeStub({ id: 'submit-form' as never });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node], edges: [] });
      const firstComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d001' as never,
        flowId: 'login-flow' as never,
        nodeId: 'submit-form' as never,
        text: 'First comment',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'review_flows',
        flows: [flow],
        comments: [firstComment],
      });

      proxy.setupQuestFound({ quest });

      const secondComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d002' as never,
        flowId: 'login-flow' as never,
        nodeId: 'submit-form' as never,
        text: 'Second comment',
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        comments: [secondComment],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.comments).toStrictEqual([firstComment, secondComment]);
    });

    it('VALID: {title only} on a quest carrying comments => persisted.comments unchanged and persisted.title updated', async () => {
      const proxy = questModifyBrokerProxy();
      const node = FlowNodeStub({ id: 'submit-form' as never });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node], edges: [] });
      const existingComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d001' as never,
        flowId: 'login-flow' as never,
        nodeId: 'submit-form' as never,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_flows',
        flows: [flow],
        comments: [existingComment],
        title: 'Old Title',
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        title: 'New Title',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect({
        title: persisted.title,
        comments: persisted.comments,
      }).toStrictEqual({
        title: 'New Title',
        comments: [existingComment],
      });
    });

    it('VALID: {flows: [delete a node]} => every comment anchored to that node is dropped from persisted.comments', async () => {
      const proxy = questModifyBrokerProxy();
      const deleteNode = FlowNodeStub({ id: 'delete-node' as never });
      const keepNode = FlowNodeStub({ id: 'keep-node' as never, label: 'Keep Node' as never });
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [deleteNode, keepNode],
        edges: [],
      });
      const deletedComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d001' as never,
        flowId: 'login-flow' as never,
        nodeId: 'delete-node' as never,
      });
      const keptComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d002' as never,
        flowId: 'login-flow' as never,
        nodeId: 'keep-node' as never,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [flow],
        comments: [deletedComment, keptComment],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        flows: [
          {
            id: 'login-flow' as never,
            nodes: [{ id: 'delete-node' as never, _delete: true }],
          } as never,
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.comments).toStrictEqual([keptComment]);
    });

    it('VALID: {flows: [delete one observable from a node]} carrying both an observable comment and a node comment => observable-anchored comment dropped, node-anchored comment survives', async () => {
      const proxy = questModifyBrokerProxy();
      const obsOne = FlowObservableStub({ id: 'obs-one' as never });
      const obsTwo = FlowObservableStub({ id: 'obs-two' as never });
      const node = FlowNodeStub({
        id: 'submit-form' as never,
        observables: [obsOne, obsTwo],
      });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node], edges: [] });
      const observableComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d001' as never,
        flowId: 'login-flow' as never,
        nodeId: 'submit-form' as never,
        observableId: 'obs-one' as never,
      });
      const nodeComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d002' as never,
        flowId: 'login-flow' as never,
        nodeId: 'submit-form' as never,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [flow],
        comments: [observableComment, nodeComment],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        flows: [
          {
            id: 'login-flow' as never,
            nodes: [
              {
                id: 'submit-form' as never,
                observables: [{ id: 'obs-one' as never, _delete: true }],
              },
            ],
          } as never,
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.comments).toStrictEqual([nodeComment]);
    });

    it('VALID: {flows: [delete a whole flow]} on a quest with two commented flows => every comment on the deleted flow is dropped, the surviving flow keeps its comments', async () => {
      const proxy = questModifyBrokerProxy();
      const flowANode = FlowNodeStub({ id: 'node-a' as never });
      const flowA = FlowStub({ id: 'flow-a' as never, nodes: [flowANode], edges: [] });
      const flowBNode = FlowNodeStub({ id: 'node-b' as never, label: 'Node B' as never });
      const flowB = FlowStub({
        id: 'flow-b' as never,
        name: 'Second Flow' as never,
        nodes: [flowBNode],
        edges: [],
      });
      const commentA = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d001' as never,
        flowId: 'flow-a' as never,
        nodeId: 'node-a' as never,
      });
      const commentB = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d002' as never,
        flowId: 'flow-b' as never,
        nodeId: 'node-b' as never,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [flowA, flowB],
        comments: [commentA, commentB],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        flows: [{ id: 'flow-a' as never, _delete: true } as never],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.comments).toStrictEqual([commentB]);
    });

    it('VALID: {flows: [rename a node label]} => that node comments survive with byte-identical text and createdAt', async () => {
      const proxy = questModifyBrokerProxy();
      const node = FlowNodeStub({ id: 'submit-form' as never, label: 'Submit Form' as never });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node], edges: [] });
      const comment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d001' as never,
        flowId: 'login-flow' as never,
        nodeId: 'submit-form' as never,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [flow],
        comments: [comment],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        flows: [
          {
            id: 'login-flow' as never,
            nodes: [{ id: 'submit-form' as never, label: 'Renamed Label' as never }],
          } as never,
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.comments).toStrictEqual([comment]);
    });

    it('VALID: {flows: [delete one node from a two-node flow]} => the sibling node comments are untouched', async () => {
      const proxy = questModifyBrokerProxy();
      const deleteNode = FlowNodeStub({ id: 'delete-me' as never });
      const siblingNode = FlowNodeStub({ id: 'keep-me' as never, label: 'Keep Me' as never });
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [deleteNode, siblingNode],
        edges: [],
      });
      const deletedComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d001' as never,
        flowId: 'login-flow' as never,
        nodeId: 'delete-me' as never,
      });
      const siblingCommentOne = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d002' as never,
        flowId: 'login-flow' as never,
        nodeId: 'keep-me' as never,
        text: 'First sibling comment',
      });
      const siblingCommentTwo = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d003' as never,
        flowId: 'login-flow' as never,
        nodeId: 'keep-me' as never,
        text: 'Second sibling comment',
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [flow],
        comments: [deletedComment, siblingCommentOne, siblingCommentTwo],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        flows: [
          {
            id: 'login-flow' as never,
            nodes: [{ id: 'delete-me' as never, _delete: true }],
          } as never,
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.comments).toStrictEqual([siblingCommentOne, siblingCommentTwo]);
    });

    it('VALID: {title only} on a quest already carrying an orphan comment => success true, no failedChecks, orphan comment still persisted', async () => {
      const proxy = questModifyBrokerProxy();
      const node = FlowNodeStub({ id: 'submit-form' as never });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node], edges: [] });
      const orphanComment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d011' as never,
        flowId: 'ghost-flow' as never,
        nodeId: 'ghost-node' as never,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'explore_flows',
        flows: [flow],
        comments: [orphanComment],
        title: 'Old Title',
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        title: 'New Title',
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({ success: true });

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.comments).toStrictEqual([orphanComment]);
    });

    it('INVALID: {comments write at status approved} => rejected by Input Allowlist; nothing persisted', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'approved',
      });

      proxy.setupQuestFound({ quest });

      const comment = QuestCommentStub({
        id: 'c0e3e17a-58cc-4372-a567-0e02b2c3d001' as never,
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        comments: [comment],
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Field(s) not allowed in status approved',
        failedChecks: [
          {
            name: 'Input Allowlist',
            passed: false,
            details: "Field 'comments' not allowed in status 'approved'",
          },
        ],
      });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });
});
