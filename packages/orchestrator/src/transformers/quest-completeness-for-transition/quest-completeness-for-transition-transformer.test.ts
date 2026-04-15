import {
  DependencyStepStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  PlanningReviewReportStub,
  PlanningScopeClassificationStub,
  PlanningSynthesisStub,
  PlanningWalkFindingsStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { questCompletenessForTransitionTransformer } from './quest-completeness-for-transition-transformer';

describe('questCompletenessForTransitionTransformer', () => {
  describe('non-gated transitions', () => {
    it('VALID: {nextStatus: in_progress, currentStatus: created, quest with orphan node} => returns empty array', () => {
      const orphan = FlowNodeStub({ id: 'orphan' as never });
      const connected = FlowNodeStub({ id: 'connected' as never });
      const edge = FlowEdgeStub({
        id: 'self' as never,
        from: 'connected' as never,
        to: 'connected' as never,
      });
      const quest = QuestStub({
        status: 'created',
        flows: [
          FlowStub({
            id: 'login-flow' as never,
            nodes: [orphan, connected],
            edges: [edge],
          }),
        ],
      });

      const failures = questCompletenessForTransitionTransformer({
        quest,
        nextStatus: 'in_progress',
      });

      expect(failures).toStrictEqual([]);
    });

    it('VALID: {nextStatus: explore_flows, quest with no flows} => returns empty array', () => {
      const quest = QuestStub();

      const failures = questCompletenessForTransitionTransformer({
        quest,
        nextStatus: 'explore_flows',
      });

      expect(failures).toStrictEqual([]);
    });

    it('VALID: {nextStatus: complete, quest with violations} => returns empty array', () => {
      const orphan = FlowNodeStub({ id: 'orphan' as never });
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow' as never, nodes: [orphan] })],
      });

      const failures = questCompletenessForTransitionTransformer({
        quest,
        nextStatus: 'complete',
      });

      expect(failures).toStrictEqual([]);
    });
  });

  describe('review_flows transition', () => {
    it('INVALID: {nextStatus: review_flows, quest with terminal orphan node} => returns the orphan check failure', () => {
      const connected = FlowNodeStub({ id: 'connected' as never, type: 'terminal' });
      const orphan = FlowNodeStub({ id: 'orphan' as never, type: 'terminal' });
      const edge = FlowEdgeStub({
        id: 'self' as never,
        from: 'connected' as never,
        to: 'connected' as never,
      });
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow' as never,
            nodes: [connected, orphan],
            edges: [edge],
          }),
        ],
      });

      const failures = questCompletenessForTransitionTransformer({
        quest,
        nextStatus: 'review_flows',
      });

      expect(failures).toStrictEqual([
        {
          name: 'No Orphan Flow Nodes',
          passed: false,
          details: "Orphan flow nodes: flow 'login-flow' has orphan node 'orphan'",
        },
      ]);
    });
  });

  describe('review_observables transition (cumulative)', () => {
    it('INVALID: {decision missing branch AND observable missing description} => returns BOTH failures', () => {
      const decision = FlowNodeStub({ id: 'check-auth' as never, type: 'decision' });
      const done = FlowNodeStub({ id: 'done' as never, type: 'terminal' });
      const oneEdge = FlowEdgeStub({
        id: 'only-edge' as never,
        from: 'check-auth' as never,
        to: 'done' as never,
        label: 'yes' as never,
      });
      const observable = FlowObservableStub({ id: 'obs-bad' as never });
      Object.assign(observable, { description: '' });
      Object.assign(done, { observables: [observable] });
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow' as never,
            nodes: [decision, done],
            edges: [oneEdge],
          }),
        ],
      });

      const failures = questCompletenessForTransitionTransformer({
        quest,
        nextStatus: 'review_observables',
      });

      expect(failures).toStrictEqual([
        {
          name: 'Decision Node Branching',
          passed: false,
          details:
            "Decision nodes missing branches: flow 'login-flow' decision 'check-auth' has 1 outgoing edges (need ≥2)",
        },
        {
          name: 'Observable Descriptions',
          passed: false,
          details:
            "Observables missing description: flow 'login-flow' node 'done' observable 'obs-bad' has empty description",
        },
      ]);
    });
  });

  describe('seek_* transitions (no composite check)', () => {
    it('VALID: {nextStatus: seek_synth} => returns empty array (gate-content handles presence)', () => {
      const quest = QuestStub({ status: 'seek_scope' });

      const failures = questCompletenessForTransitionTransformer({
        quest,
        nextStatus: 'seek_synth',
      });

      expect(failures).toStrictEqual([]);
    });

    it('VALID: {nextStatus: seek_walk} => returns empty array (gate-content handles presence)', () => {
      const quest = QuestStub({ status: 'seek_synth' });

      const failures = questCompletenessForTransitionTransformer({
        quest,
        nextStatus: 'seek_walk',
      });

      expect(failures).toStrictEqual([]);
    });

    it('VALID: {nextStatus: seek_plan} => returns empty array (gate-content handles presence)', () => {
      const quest = QuestStub({ status: 'seek_walk' });

      const failures = questCompletenessForTransitionTransformer({
        quest,
        nextStatus: 'seek_plan',
      });

      expect(failures).toStrictEqual([]);
    });
  });

  describe('seek_plan -> in_progress composite check', () => {
    it('INVALID: {reviewReport absent} => returns blocking Plan Review Report failedCheck', () => {
      const terminal = FlowNodeStub({ id: 'done' as never, type: 'terminal' });
      const observable = FlowObservableStub({ id: 'obs-ok' as never });
      Object.assign(terminal, { observables: [observable] });
      const edge = FlowEdgeStub({
        id: 'self' as never,
        from: 'done' as never,
        to: 'done' as never,
      });
      const quest = QuestStub({
        status: 'seek_plan',
        flows: [FlowStub({ id: 'login-flow' as never, nodes: [terminal], edges: [edge] })],
        steps: [DependencyStepStub({ id: 'create-user-api' as never })],
        planningNotes: {
          scopeClassification: PlanningScopeClassificationStub(),
          surfaceReports: [],
          synthesis: PlanningSynthesisStub(),
          walkFindings: PlanningWalkFindingsStub(),
        },
      });

      const failures = questCompletenessForTransitionTransformer({
        quest,
        nextStatus: 'in_progress',
      });

      expect(failures).toStrictEqual([
        {
          name: 'Plan Review Report',
          passed: false,
          details:
            'Missing planningNotes.reviewReport: plan review must be completed before transition to in_progress',
        },
      ]);
    });

    it('INVALID: {reviewReport signal=critical with 2 criticalItems} => returns blocking failedCheck listing items', () => {
      const terminal = FlowNodeStub({ id: 'done' as never, type: 'terminal' });
      const observable = FlowObservableStub({ id: 'obs-ok' as never });
      Object.assign(terminal, { observables: [observable] });
      const edge = FlowEdgeStub({
        id: 'self' as never,
        from: 'done' as never,
        to: 'done' as never,
      });
      const quest = QuestStub({
        status: 'seek_plan',
        flows: [FlowStub({ id: 'login-flow' as never, nodes: [terminal], edges: [edge] })],
        steps: [DependencyStepStub({ id: 'create-user-api' as never })],
        planningNotes: {
          scopeClassification: PlanningScopeClassificationStub(),
          surfaceReports: [],
          synthesis: PlanningSynthesisStub(),
          walkFindings: PlanningWalkFindingsStub(),
          reviewReport: PlanningReviewReportStub({
            signal: 'critical',
            criticalItems: ['Missing contract import' as never, 'Step ordering wrong' as never],
          }),
        },
      });

      const failures = questCompletenessForTransitionTransformer({
        quest,
        nextStatus: 'in_progress',
      });

      expect(failures).toStrictEqual([
        {
          name: 'Plan Review Report',
          passed: false,
          details:
            'Plan review reported critical issues: Missing contract import; Step ordering wrong',
        },
      ]);
    });

    it('VALID: {reviewReport signal=warnings with 1 warning} => returns passed (info-level) failedCheck surfacing warning', () => {
      const terminal = FlowNodeStub({ id: 'done' as never, type: 'terminal' });
      const observable = FlowObservableStub({ id: 'obs-ok' as never });
      Object.assign(terminal, { observables: [observable] });
      const edge = FlowEdgeStub({
        id: 'self' as never,
        from: 'done' as never,
        to: 'done' as never,
      });
      const quest = QuestStub({
        status: 'seek_plan',
        flows: [FlowStub({ id: 'login-flow' as never, nodes: [terminal], edges: [edge] })],
        steps: [DependencyStepStub({ id: 'create-user-api' as never })],
        planningNotes: {
          scopeClassification: PlanningScopeClassificationStub(),
          surfaceReports: [],
          synthesis: PlanningSynthesisStub(),
          walkFindings: PlanningWalkFindingsStub(),
          reviewReport: PlanningReviewReportStub({
            signal: 'warnings',
            warnings: ['Consider extracting helper' as never],
          }),
        },
      });

      const failures = questCompletenessForTransitionTransformer({
        quest,
        nextStatus: 'in_progress',
      });

      expect(failures).toStrictEqual([
        {
          name: 'Plan Review Report',
          passed: true,
          details: 'Plan review reported warnings (non-blocking): Consider extracting helper',
        },
      ]);
    });

    it('VALID: {reviewReport signal=clean, step-structure clean, spec clean} => returns empty array', () => {
      const terminal = FlowNodeStub({ id: 'done' as never, type: 'terminal' });
      const observable = FlowObservableStub({ id: 'obs-ok' as never });
      Object.assign(terminal, { observables: [observable] });
      const edge = FlowEdgeStub({
        id: 'self' as never,
        from: 'done' as never,
        to: 'done' as never,
      });
      const quest = QuestStub({
        status: 'seek_plan',
        flows: [FlowStub({ id: 'login-flow' as never, nodes: [terminal], edges: [edge] })],
        steps: [DependencyStepStub({ id: 'create-user-api' as never })],
        planningNotes: {
          scopeClassification: PlanningScopeClassificationStub(),
          surfaceReports: [],
          synthesis: PlanningSynthesisStub(),
          walkFindings: PlanningWalkFindingsStub(),
          reviewReport: PlanningReviewReportStub({ signal: 'clean' }),
        },
      });

      const failures = questCompletenessForTransitionTransformer({
        quest,
        nextStatus: 'in_progress',
      });

      expect(failures).toStrictEqual([]);
    });

    it('INVALID: {step-structure: orphan dep, missing focus, cycle} => returns three blocking step-structure failedChecks', () => {
      const terminal = FlowNodeStub({ id: 'done' as never, type: 'terminal' });
      const observable = FlowObservableStub({ id: 'obs-ok' as never });
      Object.assign(terminal, { observables: [observable] });
      const edge = FlowEdgeStub({
        id: 'self' as never,
        from: 'done' as never,
        to: 'done' as never,
      });
      const cycleA = DependencyStepStub({
        id: 'a' as never,
        dependsOn: ['b' as never],
      });
      const cycleB = DependencyStepStub({
        id: 'b' as never,
        dependsOn: ['a' as never, 'ghost' as never],
      });
      const missingFocus = DependencyStepStub({
        id: 'c' as never,
        focusFile: undefined,
      });
      const quest = QuestStub({
        status: 'seek_plan',
        flows: [FlowStub({ id: 'login-flow' as never, nodes: [terminal], edges: [edge] })],
        steps: [cycleA, cycleB, missingFocus],
        planningNotes: {
          scopeClassification: PlanningScopeClassificationStub(),
          surfaceReports: [],
          synthesis: PlanningSynthesisStub(),
          walkFindings: PlanningWalkFindingsStub(),
          reviewReport: PlanningReviewReportStub({ signal: 'clean' }),
        },
      });

      const failures = questCompletenessForTransitionTransformer({
        quest,
        nextStatus: 'in_progress',
      });

      expect(failures).toStrictEqual([
        {
          name: 'Step Focus Target',
          passed: false,
          details:
            "Steps missing focusFile/focusAction: step 'c' has neither focusFile nor focusAction",
        },
        {
          name: 'Step Dependency References',
          passed: false,
          details: "Unresolved step dependsOn references: step 'b' depends on unknown step 'ghost'",
        },
        {
          name: 'Step Dependency Graph',
          passed: false,
          details: "Cycles in step dependsOn graph: cycle in step dependsOn: 'a' -> 'b' -> 'a'",
        },
      ]);
    });
  });

  describe('non-seek_plan -> in_progress transitions (no composite check fires)', () => {
    it('VALID: {currentStatus: blocked, nextStatus: in_progress, no reviewReport} => returns empty array (resume path)', () => {
      const quest = QuestStub({
        status: 'blocked',
        // intentionally no planningNotes.reviewReport — resume paths don't require it
      });

      const failures = questCompletenessForTransitionTransformer({
        quest,
        nextStatus: 'in_progress',
      });

      expect(failures).toStrictEqual([]);
    });

    it('VALID: {currentStatus: paused, nextStatus: in_progress, no reviewReport} => returns empty array (resume path)', () => {
      const quest = QuestStub({
        status: 'paused',
      });

      const failures = questCompletenessForTransitionTransformer({
        quest,
        nextStatus: 'in_progress',
      });

      expect(failures).toStrictEqual([]);
    });
  });
});
