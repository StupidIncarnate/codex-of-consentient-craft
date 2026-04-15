import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { questCompletenessForTransitionTransformer } from './quest-completeness-for-transition-transformer';

describe('questCompletenessForTransitionTransformer', () => {
  describe('non-gated transitions', () => {
    it('VALID: {nextStatus: in_progress, quest with orphan node} => returns empty array', () => {
      const orphan = FlowNodeStub({ id: 'orphan' as never });
      const connected = FlowNodeStub({ id: 'connected' as never });
      const edge = FlowEdgeStub({
        id: 'self' as never,
        from: 'connected' as never,
        to: 'connected' as never,
      });
      const quest = QuestStub({
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
      // Setup: a decision node with only one outgoing edge (Phase 2 invariant),
      //        plus a terminal node hosting an observable with empty description (Phase 4 invariant).
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
});
