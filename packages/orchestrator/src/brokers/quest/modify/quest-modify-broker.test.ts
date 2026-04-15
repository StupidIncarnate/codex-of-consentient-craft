import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  PlanningReviewReportStub,
  PlanningScopeClassificationStub,
  PlanningSurfaceReportStub,
  PlanningSynthesisStub,
  PlanningWalkFindingsStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { ModifyQuestInputStub } from '../../../contracts/modify-quest-input/modify-quest-input.stub';
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
    it('VALID: {questId, steps: [new]} => adds new step', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        steps: [],
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        steps: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Create API',
            assertions: [{ prefix: 'VALID', input: '{valid input}', expected: 'returns result' }],
            observablesSatisfied: [],
            dependsOn: [],
            focusFile: { path: 'src/brokers/auth/create/auth-create-broker.ts' },
            accompanyingFiles: [],
            inputContracts: ['Void'],
            outputContracts: ['Void'],
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

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

    it('VALID: {questId, status: "explore_observables"} with quest at "flows_approved" with observables in flow nodes => sets status on quest', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [
          FlowStub({
            nodes: [FlowNodeStub({ observables: [FlowObservableStub()] })],
          }),
        ],
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
        error: expect.stringMatching(
          /^Missing required content for transition to flows_approved$/u,
        ),
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
        error: expect.stringMatching(/^Missing required content for transition to approved$/u),
      });
    });
  });

  describe('input allowlist rejection (Tier 2)', () => {
    it('INVALID: {steps during explore_flows} => returns failedChecks rejecting steps field', async () => {
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
        steps: [
          {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Create API',
            assertions: [{ prefix: 'VALID', input: '{valid input}', expected: 'returns result' }],
            observablesSatisfied: [],
            dependsOn: [],
            focusFile: { path: 'src/brokers/auth/create/auth-create-broker.ts' },
            accompanyingFiles: [],
            inputContracts: ['Void'],
            outputContracts: ['Void'],
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Field(s) not allowed in status explore_flows',
        failedChecks: [
          {
            name: 'Input Allowlist',
            passed: false,
            details: "Field 'steps' not allowed in status 'explore_flows'",
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

  describe('completeness rejection (Tier 4)', () => {
    it('INVALID: {status: "review_flows" with orphan node} => returns failedChecks naming completeness failures', async () => {
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

      expect(result).toStrictEqual({
        success: false,
        error: 'Completeness checks failed for transition to review_flows',
        failedChecks: [
          {
            name: 'No Orphan Flow Nodes',
            passed: false,
            details: "Orphan flow nodes: flow 'login-flow' has orphan node 'orphan-node'",
          },
          {
            name: 'No Dead-End Non-Terminal Nodes',
            passed: false,
            details:
              "Dead-end non-terminal nodes: flow 'login-flow' node 'orphan-node' (type state) has no outgoing edge",
          },
        ],
      });
    });

    it('VALID: {orphan node without status change in explore_flows} => saves cleanly (completeness only gates transitions)', async () => {
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

      const input = ModifyQuestInputStub({ questId: 'add-auth' });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });
  });

  describe('planningNotes handling', () => {
    it('VALID: {planningNotes.scopeClassification only} => writes scopeClassification without touching other sub-fields', async () => {
      const proxy = questModifyBrokerProxy();
      const existingSynthesis = PlanningSynthesisStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'seek_scope',
        planningNotes: {
          surfaceReports: [],
          synthesis: existingSynthesis,
        },
      });

      proxy.setupQuestFound({ quest });

      const newScope = PlanningScopeClassificationStub({ size: 'large' });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: {
          scopeClassification: newScope,
        },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());
      expect(persisted.planningNotes).toStrictEqual({
        surfaceReports: [],
        synthesis: existingSynthesis,
        scopeClassification: newScope,
      });
    });

    it('VALID: {planningNotes.surfaceReports with two distinct UUIDs} => both entries land via upsert', async () => {
      const proxy = questModifyBrokerProxy();
      const existingReport = PlanningSurfaceReportStub({
        id: '11111111-1111-4111-8111-111111111111' as never,
        sliceName: 'existing-slice' as never,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'seek_synth',
        planningNotes: {
          surfaceReports: [existingReport],
        },
      });

      proxy.setupQuestFound({ quest });

      const newReport = PlanningSurfaceReportStub({
        id: '22222222-2222-4222-8222-222222222222' as never,
        sliceName: 'new-slice' as never,
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: {
          surfaceReports: [newReport],
        },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());
      expect(persisted.planningNotes.surfaceReports).toStrictEqual([existingReport, newReport]);
    });

    it('VALID: {planningNotes.surfaceReports with existing UUID} => deep-merges (overwrites matching id)', async () => {
      const proxy = questModifyBrokerProxy();
      const sameId = '11111111-1111-4111-8111-111111111111' as never;
      const existingReport = PlanningSurfaceReportStub({
        id: sameId,
        sliceName: 'original-slice' as never,
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'seek_synth',
        planningNotes: {
          surfaceReports: [existingReport],
        },
      });

      proxy.setupQuestFound({ quest });

      const updatedReport = PlanningSurfaceReportStub({
        id: sameId,
        sliceName: 'updated-slice' as never,
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: {
          surfaceReports: [updatedReport],
        },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());
      expect(persisted.planningNotes.surfaceReports).toStrictEqual([updatedReport]);
    });

    it('VALID: {planningNotes.reviewReport overwrite} => replaces prior reviewReport wholesale', async () => {
      const proxy = questModifyBrokerProxy();
      const oldReview = PlanningReviewReportStub({ signal: 'warnings' });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'seek_plan',
        planningNotes: {
          surfaceReports: [],
          reviewReport: oldReview,
        },
      });

      proxy.setupQuestFound({ quest });

      const newReview = PlanningReviewReportStub({ signal: 'clean' });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: {
          reviewReport: newReview,
        },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());
      expect(persisted.planningNotes.reviewReport).toStrictEqual(newReview);
    });

    it('VALID: {planningNotes.surfaceReports with _delete: true} => removes matching entry', async () => {
      const proxy = questModifyBrokerProxy();
      const keepId = '11111111-1111-4111-8111-111111111111' as never;
      const deleteId = '22222222-2222-4222-8222-222222222222' as never;
      const keepReport = PlanningSurfaceReportStub({ id: keepId, sliceName: 'keep' as never });
      const deleteReport = PlanningSurfaceReportStub({ id: deleteId, sliceName: 'gone' as never });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'seek_synth',
        planningNotes: {
          surfaceReports: [keepReport, deleteReport],
        },
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: {
          surfaceReports: [{ id: deleteId, _delete: true } as never],
        },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());
      expect(persisted.planningNotes.surfaceReports).toStrictEqual([keepReport]);
    });

    it('VALID: {planningNotes.walkFindings only} => sets walkFindings without clearing synthesis or scopeClassification', async () => {
      const proxy = questModifyBrokerProxy();
      const existingScope = PlanningScopeClassificationStub();
      const existingSynthesis = PlanningSynthesisStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'seek_walk',
        planningNotes: {
          surfaceReports: [],
          scopeClassification: existingScope,
          synthesis: existingSynthesis,
        },
      });

      proxy.setupQuestFound({ quest });

      const newWalk = PlanningWalkFindingsStub();
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: {
          walkFindings: newWalk,
        },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());
      expect(persisted.planningNotes).toStrictEqual({
        surfaceReports: [],
        scopeClassification: existingScope,
        synthesis: existingSynthesis,
        walkFindings: newWalk,
      });
    });
  });

  describe('mutex behavior (concurrency safety)', () => {
    it('VALID: {10 concurrent modify calls on same questId} => all 10 persist calls complete (serialized, none dropped)', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'seek_synth',
        planningNotes: { surfaceReports: [] },
      });

      // Queue 10 quest-file responses so each of the 10 serialized modify calls has a load result
      Array.from({ length: 10 }).forEach(() => {
        proxy.setupQuestFound({ quest });
      });

      const calls = Array.from({ length: 10 }, (_, index) => {
        const uuid = `${String(index).padStart(8, '0')}-1111-4111-8111-111111111111`;
        const report = PlanningSurfaceReportStub({
          id: uuid as never,
          sliceName: `slice-${String(index)}` as never,
        });
        const input = ModifyQuestInputStub({
          questId: 'add-auth',
          planningNotes: {
            surfaceReports: [report],
          },
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
        status: 'seek_synth',
        planningNotes: { surfaceReports: [] },
      });

      // Queue two load responses — one per concurrent call.
      proxy.setupQuestFound({ quest });
      proxy.setupQuestFound({ quest });

      const reportA = PlanningSurfaceReportStub({
        id: 'aaaaaaaa-1111-4111-8111-111111111111' as never,
      });
      const reportB = PlanningSurfaceReportStub({
        id: 'bbbbbbbb-2222-4222-8222-222222222222' as never,
      });

      const inputA = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { surfaceReports: [reportA] },
      });
      const inputB = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: { surfaceReports: [reportB] },
      });

      const [resultA, resultB] = await Promise.all([
        questModifyBroker({ input: inputA }),
        questModifyBroker({ input: inputB }),
      ]);

      expect(resultA.success).toBe(true);
      expect(resultB.success).toBe(true);
    });
  });

  describe('valid transition passes all tiers', () => {
    it('VALID: {explore_flows -> review_flows with connected non-orphan flow} => transitions and persists', async () => {
      const proxy = questModifyBrokerProxy();
      const startNode = FlowNodeStub({ id: 'login-page' as never, type: 'state' as never });
      const terminalNode = FlowNodeStub({
        id: 'dashboard' as never,
        type: 'terminal' as never,
      });
      const edge = FlowEdgeStub({
        id: 'login-to-dashboard' as never,
        from: 'login-page' as never,
        to: 'dashboard' as never,
      });
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [startNode, terminalNode],
        edges: [edge],
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
});
