import {
  FlowNodeStub,
  FlowStub,
  ModifyQuestInputStub,
  OperationItemStub,
  PlanningBlightReportStub,
  QuestStub,
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
        planningNotes: { blightReports: [existingReport] },
      });

      proxy.setupQuestFound({ quest });

      const newReport = PlanningBlightReportStub({
        id: '22222222-2222-4222-8222-222222222222' as never,
        minion: 'dedup',
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { blightReports: [newReport] },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({ blightReports: [existingReport, newReport] });
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
        planningNotes: { blightReports: [existingReport] },
      });

      proxy.setupQuestFound({ quest });

      const updatedReport = PlanningBlightReportStub({
        id: sameId,
        minion: 'security',
        status: 'resolved',
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { blightReports: [updatedReport] },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({ blightReports: [updatedReport] });
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
        planningNotes: { blightReports: [keepReport, deleteReport] },
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { blightReports: [{ id: deleteId, _delete: true } as never] },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({ blightReports: [keepReport] });
    });
  });

  describe('mutex behavior (concurrency safety)', () => {
    it('VALID: {10 concurrent modify calls on same questId} => all 10 persist calls complete (serialized, none dropped)', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [] },
      });

      // Queue 10 quest-file responses so each of the 10 serialized modify calls has a load result
      Array.from({ length: 10 }).forEach(() => {
        proxy.setupQuestFound({ quest });
      });

      const calls = Array.from({ length: 10 }, async (_, index) => {
        const uuid = `${String(index).padStart(8, '0')}-1111-4111-8111-111111111111`;
        const report = PlanningBlightReportStub({
          id: uuid as never,
          minion: 'security',
        });
        const input = ModifyQuestInputStub({
          questId: 'add-auth',
          planningNotes: { blightReports: [report] },
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

      // One persist call per modify call — mutex serializes them, none are dropped.
      const persisted = proxy.getAllPersistedContents();

      expect(persisted.map(() => true)).toStrictEqual([
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
    });

    it('VALID: {concurrent modify calls on different questIds} => both succeed independently', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: { blightReports: [] },
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
        planningNotes: { blightReports: [reportA] },
      });
      const inputB = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { blightReports: [reportB] },
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
      proxy.setupContractSourceResolvesOnce();

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
      proxy.setupContractSourceResolvesOnce();

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
});
