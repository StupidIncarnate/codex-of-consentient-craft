import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  OperationItemStub,
  PlanningBlightReportStub,
  QuestPackageEntryStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { ModifyQuestInputStub } from '@dungeonmaster/shared/contracts';

import { questInputForbiddenFieldsTransformer } from './quest-input-forbidden-fields-transformer';

describe('questInputForbiddenFieldsTransformer', () => {
  describe('top-level field allowlist', () => {
    it('VALID: {explore_flows + flows} => returns empty array', () => {
      const input = ModifyQuestInputStub({
        flows: [FlowStub({ id: 'login-flow' as never })],
      });
      const currentQuest = QuestStub({ status: 'explore_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'explore_flows',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {explore_flows + operations} => rejects operations', () => {
      const input = ModifyQuestInputStub({
        operations: [OperationItemStub()],
      });
      const currentQuest = QuestStub({ status: 'explore_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'explore_flows',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'operations' not allowed in status 'explore_flows'",
      ]);
    });

    it('INVALID: {complete + title} => rejects every input field (terminal status)', () => {
      const input = ModifyQuestInputStub({
        title: 'New Title' as never,
      });
      const currentQuest = QuestStub({ status: 'complete' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'complete',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'title' not allowed in status 'complete'",
      ]);
    });
  });

  describe('back-transition carveout', () => {
    it('VALID: {review_flows -> explore_flows + flows} => permits flows on back transition', () => {
      const input = ModifyQuestInputStub({
        flows: [FlowStub({ id: 'login-flow' as never })],
        status: 'explore_flows',
      });
      const currentQuest = QuestStub({ status: 'review_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'review_flows',
        nextStatus: 'explore_flows',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {review_flows + flows without back transition} => rejects flows', () => {
      const input = ModifyQuestInputStub({
        flows: [FlowStub({ id: 'login-flow' as never })],
      });
      const currentQuest = QuestStub({ status: 'review_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'review_flows',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'flows' not allowed in status 'review_flows'",
      ]);
    });
  });

  describe('flowsRule: forbidden', () => {
    it('INVALID: {created + flows} => rejects flows top-level (forbidden rule)', () => {
      const input = ModifyQuestInputStub({
        flows: [FlowStub({ id: 'login-flow' as never })],
      });
      const currentQuest = QuestStub({ status: 'created' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'created',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'flows' not allowed in status 'created'",
      ]);
    });
  });

  describe('flowsRule: full', () => {
    it('VALID: {flows_approved + flows with observables and structural changes} => returns empty array', () => {
      const observable = FlowObservableStub({ id: 'redirects' as never });
      const node = FlowNodeStub({ id: 'login' as never, observables: [observable] });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node] });
      const input = ModifyQuestInputStub({ flows: [flow] });
      const currentQuest = QuestStub({ status: 'flows_approved' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'flows_approved',
      });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('flowsRule: no-observables', () => {
    it('VALID: {explore_flows + flows[].nodes[].observables: []} => permits empty observables array', () => {
      const node = FlowNodeStub({ id: 'login' as never, observables: [] });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node] });
      const input = ModifyQuestInputStub({ flows: [flow] });
      const currentQuest = QuestStub({ status: 'explore_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'explore_flows',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {explore_flows + flows with non-empty observables} => rejects observables', () => {
      const observable = FlowObservableStub({ id: 'redirects' as never });
      const node = FlowNodeStub({ id: 'login' as never, observables: [observable] });
      const flow = FlowStub({ id: 'login-flow' as never, nodes: [node] });
      const input = ModifyQuestInputStub({ flows: [flow] });
      const currentQuest = QuestStub({ status: 'explore_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'explore_flows',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Observables not allowed in flow 'login-flow' node 'login' in status 'explore_flows' (Phase 4 work — embed observables after flows are approved)",
      ]);
    });
  });

  describe('flowsRule: additive-only', () => {
    it('VALID: {in_progress + replace existing observable wording} => returns empty array', () => {
      const existingObservable = FlowObservableStub({ id: 'redirects' as never });
      const existingNode = FlowNodeStub({
        id: 'login' as never,
        observables: [existingObservable],
      });
      const existingEdge = FlowEdgeStub({
        id: 'self' as never,
        from: 'login' as never,
        to: 'login' as never,
      });
      const existingFlow = FlowStub({
        id: 'login-flow' as never,
        nodes: [existingNode],
        edges: [existingEdge],
      });
      const currentQuest = QuestStub({
        status: 'in_progress',
        flows: [existingFlow],
      });

      const replacementObservable = FlowObservableStub({
        id: 'redirects' as never,
        description: 'redirects to /home instead' as never,
      });
      const updateNode = FlowNodeStub({
        id: 'login' as never,
        observables: [replacementObservable],
      });
      const updateFlow = FlowStub({
        id: 'login-flow' as never,
        nodes: [updateNode],
      });
      const input = ModifyQuestInputStub({ flows: [updateFlow] });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {in_progress + add new flow} => rejects flow add', () => {
      const currentQuest = QuestStub({ status: 'in_progress', flows: [] });
      const newFlow = FlowStub({ id: 'brand-new-flow' as never });
      const input = ModifyQuestInputStub({ flows: [newFlow] });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Flow add not allowed in status 'in_progress' (attempted to add flow 'brand-new-flow') — you may add nodes, edges, and observables to an EXISTING flow, but not a new flow",
      ]);
    });

    it('VALID: {in_progress + add new node and edge to existing flow} => allowed, a session may record a branch it discovered', () => {
      const existingNode = FlowNodeStub({ id: 'login' as never });
      const existingEdge = FlowEdgeStub({
        id: 'self' as never,
        from: 'login' as never,
        to: 'login' as never,
      });
      const existingFlow = FlowStub({
        id: 'login-flow' as never,
        nodes: [existingNode],
        edges: [existingEdge],
      });
      const currentQuest = QuestStub({
        status: 'in_progress',
        flows: [existingFlow],
      });

      const newNode = FlowNodeStub({ id: 'new-node' as never });
      const newEdge = FlowEdgeStub({
        id: 'new-edge' as never,
        from: 'login' as never,
        to: 'new-node' as never,
      });
      const updateFlow = FlowStub({
        id: 'login-flow' as never,
        nodes: [newNode],
        edges: [newEdge],
      });
      const input = ModifyQuestInputStub({ flows: [updateFlow] });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {in_progress + delete existing observable} => rejects observable delete', () => {
      const existingObservable = FlowObservableStub({ id: 'redirects' as never });
      const existingNode = FlowNodeStub({
        id: 'login' as never,
        observables: [existingObservable],
      });
      const existingFlow = FlowStub({ id: 'login-flow' as never, nodes: [existingNode] });
      const currentQuest = QuestStub({
        status: 'in_progress',
        flows: [existingFlow],
      });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            name: 'Login Flow',
            flowType: 'runtime',
            entryPoint: '/login',
            exitPoints: ['/dashboard'],
            nodes: [
              {
                id: 'login',
                label: 'Login',
                type: 'state',
                observables: [{ id: 'redirects', _delete: true }],
              },
            ],
          },
        ] as never,
      });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Observable delete not allowed in status 'in_progress' (attempted to delete observable 'redirects' from node 'login' in flow 'login-flow') — you may add observables, never remove one",
      ]);
    });

    it('VALID: {in_progress + add new observable to existing node} => allowed, adding only tightens the target', () => {
      const existingNode = FlowNodeStub({ id: 'login' as never, observables: [] });
      const existingFlow = FlowStub({ id: 'login-flow' as never, nodes: [existingNode] });
      const currentQuest = QuestStub({
        status: 'in_progress',
        flows: [existingFlow],
      });

      const newObservable = FlowObservableStub({ id: 'brand-new-obs' as never });
      const updateNode = FlowNodeStub({
        id: 'login' as never,
        observables: [newObservable],
      });
      const updateFlow = FlowStub({ id: 'login-flow' as never, nodes: [updateNode] });
      const input = ModifyQuestInputStub({ flows: [updateFlow] });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('in_progress planningNotes ungating (allowedPlanningNotesFields: all)', () => {
    it('VALID: {in_progress + planningNotes.blightReports only} => returns empty array (in_progress is ungated)', () => {
      const blight = PlanningBlightReportStub();
      const input = ModifyQuestInputStub({
        planningNotes: {
          blightReports: [blight],
        },
      });
      const currentQuest = QuestStub({ status: 'in_progress' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {in_progress + planningNotes.blightReports partial-patch by id} => permits patch shape (in_progress is ungated)', () => {
      const blight = PlanningBlightReportStub({ id: '11111111-1111-1111-1111-111111111111' });
      const input = ModifyQuestInputStub({
        planningNotes: {
          blightReports: [{ id: blight.id, status: 'resolved' }],
        },
      });
      const currentQuest = QuestStub({ status: 'in_progress' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {created + planningNotes.blightReports only} => rejects planningNotes wholesale (created forbids planningNotes)', () => {
      const blight = PlanningBlightReportStub();
      const input = ModifyQuestInputStub({
        planningNotes: {
          blightReports: [blight],
        },
      });
      const currentQuest = QuestStub({ status: 'created' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'created',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'planningNotes' not allowed in status 'created'",
      ]);
    });
  });

  describe('operations field allowlist', () => {
    it('VALID: {explore_observables + operations} => returns empty array', () => {
      const input = ModifyQuestInputStub({
        operations: [OperationItemStub()],
      });
      const currentQuest = QuestStub({ status: 'explore_observables' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'explore_observables',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {in_progress + operations} => rejects operations (execution agents signal outcomes instead of writing the ledger)', () => {
      const input = ModifyQuestInputStub({
        operations: [OperationItemStub()],
      });
      const currentQuest = QuestStub({ status: 'in_progress' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'operations' not allowed in status 'in_progress'",
      ]);
    });

    it('VALID: {review_observables -> explore_observables + operations} => permits operations on back transition', () => {
      const input = ModifyQuestInputStub({
        operations: [OperationItemStub()],
        status: 'explore_observables',
      });
      const currentQuest = QuestStub({ status: 'review_observables' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'review_observables',
        nextStatus: 'explore_observables',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {review_observables + operations without back transition} => rejects operations', () => {
      const input = ModifyQuestInputStub({
        operations: [OperationItemStub()],
      });
      const currentQuest = QuestStub({ status: 'review_observables' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'review_observables',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'operations' not allowed in status 'review_observables'",
      ]);
    });
  });

  describe('packagesAffected field allowlist', () => {
    it('VALID: {explore_observables + packagesAffected} => returns empty array', () => {
      const input = ModifyQuestInputStub({
        packagesAffected: [
          QuestPackageEntryStub({ name: 'orchestrator', location: './packages/orchestrator' }),
          QuestPackageEntryStub({ name: 'web', location: './packages/web' }),
        ],
      });
      const currentQuest = QuestStub({ status: 'explore_observables' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'explore_observables',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {flows_approved + packagesAffected} => returns empty array', () => {
      const input = ModifyQuestInputStub({
        packagesAffected: [
          QuestPackageEntryStub({ name: 'shared', location: './packages/shared' }),
        ],
      });
      const currentQuest = QuestStub({ status: 'flows_approved' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'flows_approved',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {in_progress + packagesAffected} => allowed, a repair can pull in a package the spec never listed', () => {
      const input = ModifyQuestInputStub({
        packagesAffected: [
          QuestPackageEntryStub({ name: 'orchestrator', location: './packages/orchestrator' }),
        ],
      });
      const currentQuest = QuestStub({ status: 'in_progress' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {explore_flows + packagesAffected + flows} => allowed, a node tag and the entry it names land in one call', () => {
      const input = ModifyQuestInputStub({
        packagesAffected: [QuestPackageEntryStub({ name: 'web', location: './packages/web' })],
        flows: [FlowStub({ id: 'login-flow' as never })],
      });
      const currentQuest = QuestStub({ status: 'explore_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'explore_flows',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {review_flows -> explore_flows + packagesAffected} => permitted on the back transition, so a retag can declare the package it reaches for', () => {
      const input = ModifyQuestInputStub({
        packagesAffected: [QuestPackageEntryStub({ name: 'web', location: './packages/web' })],
        status: 'explore_flows',
      });
      const currentQuest = QuestStub({ status: 'review_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'review_flows',
        nextStatus: 'explore_flows',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {review_flows + packagesAffected without back transition} => rejects packagesAffected', () => {
      const input = ModifyQuestInputStub({
        packagesAffected: [QuestPackageEntryStub({ name: 'web', location: './packages/web' })],
      });
      const currentQuest = QuestStub({ status: 'review_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'review_flows',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'packagesAffected' not allowed in status 'review_flows'",
      ]);
    });
  });
});
