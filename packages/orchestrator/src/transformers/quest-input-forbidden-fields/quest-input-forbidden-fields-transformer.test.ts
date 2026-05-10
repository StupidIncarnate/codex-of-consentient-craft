import {
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

    it('INVALID: {explore_flows + steps} => rejects steps', () => {
      const input = ModifyQuestInputStub({
        steps: [],
      });
      const currentQuest = QuestStub({ status: 'explore_flows' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'explore_flows',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'steps' not allowed in status 'explore_flows'",
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

  describe('flowsRule: observable-wording-only', () => {
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
        "Flow add not allowed in status 'in_progress' (attempted to add flow 'brand-new-flow')",
      ]);
    });

    it('INVALID: {in_progress + add new node and edge to existing flow} => rejects node add and edge add', () => {
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

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Node add not allowed in status 'in_progress' (attempted to add node 'new-node' to flow 'login-flow')",
        "Edge add not allowed in status 'in_progress' (attempted to add edge 'new-edge' to flow 'login-flow')",
      ]);
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
        "Observable delete not allowed in status 'in_progress' (attempted to delete observable 'redirects' from node 'login' in flow 'login-flow') — only wording replacement on existing observables",
      ]);
    });

    it('INVALID: {in_progress + add new observable to existing node} => rejects observable add', () => {
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

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Observable add not allowed in status 'in_progress' (attempted to add observable 'brand-new-obs' to node 'login' in flow 'login-flow') — only wording replacement on existing observables",
      ]);
    });
  });

  describe('blightReportsRule: nested-path carveout', () => {
    it('VALID: {in_progress + planningNotes.blightReports only} => permits (blightReportsRule: full)', () => {
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

    it('INVALID: {in_progress + planningNotes with blightReports AND surfaceReports} => rejects planningNotes (not blight-only)', () => {
      const blight = PlanningBlightReportStub();
      const surface = PlanningSurfaceReportStub();
      const input = ModifyQuestInputStub({
        planningNotes: {
          blightReports: [blight],
          surfaceReports: [surface],
        },
      });
      const currentQuest = QuestStub({ status: 'in_progress' });

      const offenders = questInputForbiddenFieldsTransformer({
        input,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders.map((o) => String(o))).toStrictEqual([
        "Field 'planningNotes' not allowed in status 'in_progress'",
      ]);
    });

    it('INVALID: {created + planningNotes.blightReports only} => rejects (blightReportsRule: forbidden)', () => {
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

  describe('planningNotes sub-field allowlist per seek_* status', () => {
    describe('seek_scope', () => {
      it('VALID: {seek_scope + planningNotes.scopeClassification} => returns empty array', () => {
        const input = ModifyQuestInputStub({
          planningNotes: {
            scopeClassification: PlanningScopeClassificationStub(),
          },
        });
        const currentQuest = QuestStub({ status: 'seek_scope' });

        const offenders = questInputForbiddenFieldsTransformer({
          input,
          currentQuest,
          currentStatus: 'seek_scope',
        });

        expect(offenders).toStrictEqual([]);
      });

      it('INVALID: {seek_scope + planningNotes.surfaceReports} => rejects surfaceReports sub-field', () => {
        const input = ModifyQuestInputStub({
          planningNotes: {
            surfaceReports: [PlanningSurfaceReportStub()],
          },
        });
        const currentQuest = QuestStub({ status: 'seek_scope' });

        const offenders = questInputForbiddenFieldsTransformer({
          input,
          currentQuest,
          currentStatus: 'seek_scope',
        });

        expect(offenders.map((o) => String(o))).toStrictEqual([
          "Sub-field 'planningNotes.surfaceReports' not allowed in status 'seek_scope'",
        ]);
      });

      it('INVALID: {seek_scope + planningNotes.synthesis} => rejects synthesis sub-field', () => {
        const input = ModifyQuestInputStub({
          planningNotes: {
            synthesis: PlanningSynthesisStub(),
          },
        });
        const currentQuest = QuestStub({ status: 'seek_scope' });

        const offenders = questInputForbiddenFieldsTransformer({
          input,
          currentQuest,
          currentStatus: 'seek_scope',
        });

        expect(offenders.map((o) => String(o))).toStrictEqual([
          "Sub-field 'planningNotes.synthesis' not allowed in status 'seek_scope'",
        ]);
      });

      it('INVALID: {seek_scope + planningNotes.walkFindings} => rejects walkFindings sub-field', () => {
        const input = ModifyQuestInputStub({
          planningNotes: {
            walkFindings: PlanningWalkFindingsStub(),
          },
        });
        const currentQuest = QuestStub({ status: 'seek_scope' });

        const offenders = questInputForbiddenFieldsTransformer({
          input,
          currentQuest,
          currentStatus: 'seek_scope',
        });

        expect(offenders.map((o) => String(o))).toStrictEqual([
          "Sub-field 'planningNotes.walkFindings' not allowed in status 'seek_scope'",
        ]);
      });

      it('INVALID: {seek_scope + planningNotes.blightReports} => rejects blightReports sub-field', () => {
        const input = ModifyQuestInputStub({
          planningNotes: {
            blightReports: [PlanningBlightReportStub()],
          },
        });
        const currentQuest = QuestStub({ status: 'seek_scope' });

        const offenders = questInputForbiddenFieldsTransformer({
          input,
          currentQuest,
          currentStatus: 'seek_scope',
        });

        expect(offenders.map((o) => String(o))).toStrictEqual([
          "Sub-field 'planningNotes.blightReports' not allowed in status 'seek_scope'",
        ]);
      });
    });

    describe('seek_synth', () => {
      it('VALID: {seek_synth + planningNotes.surfaceReports} => returns empty array', () => {
        const input = ModifyQuestInputStub({
          planningNotes: {
            surfaceReports: [PlanningSurfaceReportStub()],
          },
        });
        const currentQuest = QuestStub({ status: 'seek_synth' });

        const offenders = questInputForbiddenFieldsTransformer({
          input,
          currentQuest,
          currentStatus: 'seek_synth',
        });

        expect(offenders).toStrictEqual([]);
      });

      it('VALID: {seek_synth + planningNotes.synthesis} => returns empty array', () => {
        const input = ModifyQuestInputStub({
          planningNotes: {
            synthesis: PlanningSynthesisStub(),
          },
        });
        const currentQuest = QuestStub({ status: 'seek_synth' });

        const offenders = questInputForbiddenFieldsTransformer({
          input,
          currentQuest,
          currentStatus: 'seek_synth',
        });

        expect(offenders).toStrictEqual([]);
      });

      it('INVALID: {seek_synth + planningNotes.scopeClassification} => rejects scopeClassification sub-field', () => {
        const input = ModifyQuestInputStub({
          planningNotes: {
            scopeClassification: PlanningScopeClassificationStub(),
          },
        });
        const currentQuest = QuestStub({ status: 'seek_synth' });

        const offenders = questInputForbiddenFieldsTransformer({
          input,
          currentQuest,
          currentStatus: 'seek_synth',
        });

        expect(offenders.map((o) => String(o))).toStrictEqual([
          "Sub-field 'planningNotes.scopeClassification' not allowed in status 'seek_synth'",
        ]);
      });

      it('INVALID: {seek_synth + planningNotes.walkFindings} => rejects walkFindings sub-field', () => {
        const input = ModifyQuestInputStub({
          planningNotes: {
            walkFindings: PlanningWalkFindingsStub(),
          },
        });
        const currentQuest = QuestStub({ status: 'seek_synth' });

        const offenders = questInputForbiddenFieldsTransformer({
          input,
          currentQuest,
          currentStatus: 'seek_synth',
        });

        expect(offenders.map((o) => String(o))).toStrictEqual([
          "Sub-field 'planningNotes.walkFindings' not allowed in status 'seek_synth'",
        ]);
      });

      it('INVALID: {seek_synth + planningNotes.blightReports} => rejects blightReports sub-field', () => {
        const input = ModifyQuestInputStub({
          planningNotes: {
            blightReports: [PlanningBlightReportStub()],
          },
        });
        const currentQuest = QuestStub({ status: 'seek_synth' });

        const offenders = questInputForbiddenFieldsTransformer({
          input,
          currentQuest,
          currentStatus: 'seek_synth',
        });

        expect(offenders.map((o) => String(o))).toStrictEqual([
          "Sub-field 'planningNotes.blightReports' not allowed in status 'seek_synth'",
        ]);
      });
    });

    describe('seek_walk', () => {
      it('VALID: {seek_walk + planningNotes.walkFindings} => returns empty array', () => {
        const input = ModifyQuestInputStub({
          planningNotes: {
            walkFindings: PlanningWalkFindingsStub(),
          },
        });
        const currentQuest = QuestStub({ status: 'seek_walk' });

        const offenders = questInputForbiddenFieldsTransformer({
          input,
          currentQuest,
          currentStatus: 'seek_walk',
        });

        expect(offenders).toStrictEqual([]);
      });

      it('INVALID: {seek_walk + planningNotes.scopeClassification} => rejects scopeClassification sub-field', () => {
        const input = ModifyQuestInputStub({
          planningNotes: {
            scopeClassification: PlanningScopeClassificationStub(),
          },
        });
        const currentQuest = QuestStub({ status: 'seek_walk' });

        const offenders = questInputForbiddenFieldsTransformer({
          input,
          currentQuest,
          currentStatus: 'seek_walk',
        });

        expect(offenders.map((o) => String(o))).toStrictEqual([
          "Sub-field 'planningNotes.scopeClassification' not allowed in status 'seek_walk'",
        ]);
      });

      it('INVALID: {seek_walk + planningNotes.surfaceReports} => rejects surfaceReports sub-field', () => {
        const input = ModifyQuestInputStub({
          planningNotes: {
            surfaceReports: [PlanningSurfaceReportStub()],
          },
        });
        const currentQuest = QuestStub({ status: 'seek_walk' });

        const offenders = questInputForbiddenFieldsTransformer({
          input,
          currentQuest,
          currentStatus: 'seek_walk',
        });

        expect(offenders.map((o) => String(o))).toStrictEqual([
          "Sub-field 'planningNotes.surfaceReports' not allowed in status 'seek_walk'",
        ]);
      });

      it('INVALID: {seek_walk + planningNotes.synthesis} => rejects synthesis sub-field', () => {
        const input = ModifyQuestInputStub({
          planningNotes: {
            synthesis: PlanningSynthesisStub(),
          },
        });
        const currentQuest = QuestStub({ status: 'seek_walk' });

        const offenders = questInputForbiddenFieldsTransformer({
          input,
          currentQuest,
          currentStatus: 'seek_walk',
        });

        expect(offenders.map((o) => String(o))).toStrictEqual([
          "Sub-field 'planningNotes.synthesis' not allowed in status 'seek_walk'",
        ]);
      });

      it('INVALID: {seek_walk + planningNotes.blightReports} => rejects blightReports sub-field', () => {
        const input = ModifyQuestInputStub({
          planningNotes: {
            blightReports: [PlanningBlightReportStub()],
          },
        });
        const currentQuest = QuestStub({ status: 'seek_walk' });

        const offenders = questInputForbiddenFieldsTransformer({
          input,
          currentQuest,
          currentStatus: 'seek_walk',
        });

        expect(offenders.map((o) => String(o))).toStrictEqual([
          "Sub-field 'planningNotes.blightReports' not allowed in status 'seek_walk'",
        ]);
      });
    });

    describe('in_progress sub-field enforcement (alongside existing blight carveout)', () => {
      it('VALID: {in_progress + planningNotes.blightReports} => returns empty array (blight carveout still works)', () => {
        const input = ModifyQuestInputStub({
          planningNotes: {
            blightReports: [PlanningBlightReportStub()],
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
    });
  });
});
