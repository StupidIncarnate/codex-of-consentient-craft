import {
  DependencyStepStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  PlanningBlightReportStub,
  PlanningScopeClassificationStub,
  PlanningSurfaceReportStub,
  PlanningSynthesisStub,
  PlanningWalkFindingsStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { ModifyQuestInputStub } from '@dungeonmaster/shared/contracts';
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
            id: 'backend-create-api',
            slice: 'backend',
            name: 'Create API',
            assertions: [{ prefix: 'VALID', input: '{valid input}', expected: 'returns result' }],
            observablesSatisfied: [],
            dependsOn: [],
            focusFile: { path: 'src/brokers/auth/create/auth-create-broker.ts' },
            accompanyingFiles: [
              { path: 'src/brokers/auth/create/auth-create-broker.proxy.ts' },
              { path: 'src/brokers/auth/create/auth-create-broker.test.ts' },
            ],
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
      // Seed a step whose outputContracts produces the new contract so the
      // V7 (orphan new contracts) invariant is satisfied — every status:'new'
      // contract must be created by at least one step.
      const seededStep = DependencyStepStub({
        id: 'backend-create-login-credentials' as never,
        outputContracts: ['LoginCredentials' as never],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [flow],
        contracts: [],
        steps: [seededStep],
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
      // Without a re-parse before invariants/completeness checks, downstream offender
      // finders trip "node.observables is not iterable".
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

    it('VALID: {questId, status: "explore_observables"} with quest at "flows_approved" with observables in flow nodes => sets status on quest', async () => {
      const proxy = questModifyBrokerProxy();
      const observable = FlowObservableStub();
      // Seed a step claiming the observable so the V8 (unsatisfied observables)
      // invariant — which runs on every modify-quest call — is satisfied. The
      // step id is slice-prefixed so the V1 invariant also passes.
      const seededStep = DependencyStepStub({
        id: 'backend-create-login-api' as never,
        observablesSatisfied: [observable.id],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [
          FlowStub({
            nodes: [FlowNodeStub({ observables: [observable] })],
          }),
        ],
        steps: [seededStep],
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
            slice: 'backend',
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
        blightReports: [],
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
        planningNotes: {
          surfaceReports: [],
          blightReports: [existingReport],
        },
      });

      proxy.setupQuestFound({ quest });

      const newReport = PlanningBlightReportStub({
        id: '22222222-2222-4222-8222-222222222222' as never,
        minion: 'dedup',
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: {
          blightReports: [newReport],
        },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes.blightReports).toStrictEqual([existingReport, newReport]);
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
        planningNotes: {
          surfaceReports: [],
          blightReports: [existingReport],
        },
      });

      proxy.setupQuestFound({ quest });

      const updatedReport = PlanningBlightReportStub({
        id: sameId,
        minion: 'security',
        status: 'resolved',
      });
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: {
          blightReports: [updatedReport],
        },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes.blightReports).toStrictEqual([updatedReport]);
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
        planningNotes: {
          surfaceReports: [],
          blightReports: [keepReport, deleteReport],
        },
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: {
          blightReports: [{ id: deleteId, _delete: true } as never],
        },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes.blightReports).toStrictEqual([keepReport]);
    });

    it('VALID: {planningNotes.blightReports only} => does not clear surfaceReports or other sub-fields', async () => {
      const proxy = questModifyBrokerProxy();
      const existingSurface = PlanningSurfaceReportStub();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
        planningNotes: {
          surfaceReports: [existingSurface],
          blightReports: [],
        },
      });

      proxy.setupQuestFound({ quest });

      const newBlight = PlanningBlightReportStub();
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        planningNotes: {
          blightReports: [newBlight],
        },
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.planningNotes).toStrictEqual({
        surfaceReports: [existingSurface],
        blightReports: [newBlight],
      });
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
        blightReports: [],
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

      const calls = Array.from({ length: 10 }, async (_, index) => {
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

  describe('completeness scope gating (Tier 3, transition-to-in_progress only)', () => {
    it('VALID: {modify-quest without status: in_progress, quest with unsatisfied observable} => succeeds (completeness skipped on slice-by-slice commits)', async () => {
      const proxy = questModifyBrokerProxy();
      const observable = FlowObservableStub({ id: 'obs-orphan' as never });
      const node = FlowNodeStub({
        id: 'login-page' as never,
        observables: [observable],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'seek_synth',
        flows: [FlowStub({ id: 'login-flow' as never, nodes: [node] })],
        steps: [],
        planningNotes: { surfaceReports: [] },
      });

      proxy.setupQuestFound({ quest });

      // Seek_synth permits step writes; commit a step that does NOT satisfy the
      // observable. Without the new completeness scope split, V8 would have
      // fired here (the old gating ran V8 once steps.length > 0). With the
      // split, V8 only fires on transition to in_progress, so this commit lands.
      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        steps: [
          {
            id: 'backend-create-other',
            slice: 'backend',
            name: 'Other',
            assertions: [{ prefix: 'VALID', input: '{x}', expected: 'returns y' }],
            observablesSatisfied: [],
            dependsOn: [],
            focusFile: { path: 'src/brokers/other/create/other-create-broker.ts' },
            accompanyingFiles: [
              { path: 'src/brokers/other/create/other-create-broker.proxy.ts' },
              { path: 'src/brokers/other/create/other-create-broker.test.ts' },
            ],
            inputContracts: ['Void'],
            outputContracts: ['Void'],
          },
        ],
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);
    });

    it('INVALID: {status: in_progress, quest with unsatisfied observable} => rejects with completeness failure (V8 fires at transition)', async () => {
      const proxy = questModifyBrokerProxy();
      const observable = FlowObservableStub({ id: 'obs-orphan' as never });
      const terminal = FlowNodeStub({
        id: 'login-page' as never,
        type: 'terminal' as never,
        observables: [observable],
      });
      const edge = FlowEdgeStub({
        id: 'self' as never,
        from: 'login-page' as never,
        to: 'login-page' as never,
      });
      const unrelatedStep = DependencyStepStub({
        id: 'backend-other-step' as never,
        slice: 'backend' as never,
        observablesSatisfied: [],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'seek_walk',
        flows: [FlowStub({ id: 'login-flow' as never, nodes: [terminal], edges: [edge] })],
        steps: [unrelatedStep],
        planningNotes: {
          surfaceReports: [],
          scopeClassification: PlanningScopeClassificationStub(),
          synthesis: PlanningSynthesisStub(),
          walkFindings: PlanningWalkFindingsStub(),
        },
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'in_progress',
      });

      const result = await questModifyBroker({ input });

      expect(result).toStrictEqual({
        success: false,
        error: 'Save invariants failed',
        failedChecks: [
          {
            name: 'Observables Are Satisfied',
            passed: false,
            details:
              "Unsatisfied observables: observable 'obs-orphan' (flow 'login-flow', node 'login-page') is not claimed by any step.observablesSatisfied or step.assertions[].observablesSatisfied",
          },
        ],
      });
      expect(proxy.getAllPersistedContents()).toStrictEqual([]);
    });
  });

  describe('pausedAtStatus handling (orchestrator-only field)', () => {
    it('VALID: {pausedAtStatus: "seek_scope"} => sets quest.pausedAtStatus to "seek_scope"', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'in_progress',
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        pausedAtStatus: 'seek_scope',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.pausedAtStatus).toBe('seek_scope');
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
        pausedAtStatus: 'seek_scope',
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());

      expect(persisted.pausedAtStatus).toBe('seek_scope');
    });

    it('VALID: {pausedAtStatus: null, status: "seek_scope"} => clears quest.pausedAtStatus from the record', async () => {
      const proxy = questModifyBrokerProxy();
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'paused',
        pausedAtStatus: 'seek_scope',
      });

      proxy.setupQuestFound({ quest });

      const input = ModifyQuestInputStub({
        questId: 'add-auth',
        status: 'seek_scope',
        pausedAtStatus: null,
      });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persistedContents = proxy.getAllPersistedContents();
      const latestRaw = persistedContents[persistedContents.length - 1];
      const parsedRaw = JSON.parse(String(latestRaw)) as Record<PropertyKey, unknown>;

      expect('pausedAtStatus' in parsedRaw).toBe(false);
      expect(parsedRaw.status).toBe('seek_scope');
    });
  });

  describe('cross-slice DAG auto-wiring (post-upsert)', () => {
    it("VALID: {seeded cross-slice consumer.uses[] resolves to another slice's outputContracts} => broker auto-appends producer id to consumer.dependsOn on persist", async () => {
      const proxy = questModifyBrokerProxy();
      // Producer in 'backend' slice exporting ThingContract via outputContracts.
      // Default DependencyStepStub focusFile is `src/brokers/login/create/...` —
      // that's the producer's file.
      const producerStep = DependencyStepStub({
        id: 'backend-make-thing' as never,
        slice: 'backend' as never,
        outputContracts: ['ThingContract' as never],
        exportName: 'thingContract' as never,
      });
      // Consumer in 'web' slice referencing ThingContract via uses[]. Different
      // focusFile (V2 duplicate-focus-files invariant) and broker-folder companions.
      const consumerStep = DependencyStepStub({
        id: 'web-use-thing' as never,
        slice: 'web' as never,
        uses: ['ThingContract' as never],
        dependsOn: [],
        focusFile: { path: 'src/brokers/thing/render/thing-render-broker.ts' },
        accompanyingFiles: [
          { path: 'src/brokers/thing/render/thing-render-broker.proxy.ts' },
          { path: 'src/brokers/thing/render/thing-render-broker.test.ts' },
        ],
      });
      const quest = QuestStub({
        id: 'add-thing',
        folder: '001-add-thing',
        status: 'in_progress',
        steps: [producerStep, consumerStep],
      });

      proxy.setupQuestFound({ quest });

      // No-op modify (just the questId) — auto-wire still runs on the post-upsert
      // quest.steps and the persisted snapshot reflects the wired graph.
      const input = ModifyQuestInputStub({ questId: 'add-thing' });

      const result = await questModifyBroker({ input });

      expect(result.success).toBe(true);

      const persisted = parseLatestPersisted(proxy.getAllPersistedContents());
      const persistedConsumer = persisted.steps.find((step) => String(step.id) === 'web-use-thing');

      expect(persistedConsumer?.dependsOn).toStrictEqual(['backend-make-thing']);
    });
  });

  describe('contract source path resolution (DET3)', () => {
    it('INVALID: {contracts: [new] but source already resolves on disk} => returns Contract Source Resolution failedCheck', async () => {
      const proxy = questModifyBrokerProxy();
      const flow = FlowStub({
        id: 'login-flow' as never,
        nodes: [FlowNodeStub({ id: 'submit-form' as never })],
      });
      const seededStep = DependencyStepStub({
        id: 'backend-create-login-credentials' as never,
        outputContracts: ['LoginCredentials' as never],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [flow],
        contracts: [],
        steps: [seededStep],
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
      const seededStep = DependencyStepStub({
        id: 'backend-consume-existing' as never,
        outputContracts: ['Void' as never],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [flow],
        contracts: [],
        steps: [seededStep],
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
      const seededStep = DependencyStepStub({
        id: 'backend-consume-shared' as never,
        outputContracts: ['Void' as never],
      });
      const quest = QuestStub({
        id: 'add-auth',
        folder: '001-add-auth',
        status: 'flows_approved',
        flows: [flow],
        contracts: [],
        steps: [seededStep],
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
