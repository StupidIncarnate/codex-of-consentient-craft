import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowOffMapSignoffStub,
  FlowStub,
  ModifyQuestInputStub,
  QuestStub,
  SignoffStub,
} from '@dungeonmaster/shared/contracts';

import { questSignoffUnknownUnitViolationsTransformer } from './quest-signoff-unknown-unit-violations-transformer';

describe('questSignoffUnknownUnitViolationsTransformer', () => {
  describe('observables', () => {
    it('INVALID: {sign-off on an observable id that is not on the node} => rejected, naming the observable, its node and its flow', () => {
      const existingObservable = FlowObservableStub({ id: 'redirects' as never });
      const existingNode = FlowNodeStub({
        id: 'login' as never,
        observables: [existingObservable],
      });
      const existingFlow = FlowStub({ id: 'login-flow' as never, nodes: [existingNode] });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [
              {
                id: 'login',
                observables: [{ id: 'redirectz', siegemasterSignoff: SignoffStub() }],
              },
            ],
          },
        ] as never,
      });

      const offenders = questSignoffUnknownUnitViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
      });

      expect(offenders.map(String)).toStrictEqual([
        "Sign-off on unknown observable 'redirectz' — no observable with that id exists on node 'login' in flow 'login-flow'; a sign-off may only be written on a unit that already exists, and an unknown id appends a phantom unit instead of signing the intended one",
      ]);
    });

    it('VALID: {sign-off on an observable that exists on that node} => returns empty array', () => {
      const existingObservable = FlowObservableStub({ id: 'redirects' as never });
      const existingNode = FlowNodeStub({
        id: 'login' as never,
        observables: [existingObservable],
      });
      const existingFlow = FlowStub({ id: 'login-flow' as never, nodes: [existingNode] });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [
              {
                id: 'login',
                observables: [{ id: 'redirects', siegemasterSignoff: SignoffStub() }],
              },
            ],
          },
        ] as never,
      });

      const offenders = questSignoffUnknownUnitViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
      });

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {sign-off on an observable that exists but on a DIFFERENT node} => rejected, because the check is positional', () => {
      const signedObservable = FlowObservableStub({ id: 'redirects' as never });
      const nodeWithObservable = FlowNodeStub({
        id: 'login' as never,
        observables: [signedObservable],
      });
      const otherNode = FlowNodeStub({ id: 'dashboard' as never, observables: [] });
      const existingFlow = FlowStub({
        id: 'login-flow' as never,
        nodes: [nodeWithObservable, otherNode],
      });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [
              {
                id: 'dashboard',
                observables: [{ id: 'redirects', flowriderSignoff: SignoffStub() }],
              },
            ],
          },
        ] as never,
      });

      const offenders = questSignoffUnknownUnitViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
      });

      expect(offenders.map(String)).toStrictEqual([
        "Sign-off on unknown observable 'redirects' — no observable with that id exists on node 'dashboard' in flow 'login-flow'; a sign-off may only be written on a unit that already exists, and an unknown id appends a phantom unit instead of signing the intended one",
      ]);
    });

    it('VALID: {brand-new observable carrying NO sign-off} => returns empty array, the additive spec authority is untouched', () => {
      const existingNode = FlowNodeStub({ id: 'login' as never, observables: [] });
      const existingFlow = FlowStub({ id: 'login-flow' as never, nodes: [existingNode] });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [
              {
                id: 'login',
                observables: [
                  {
                    id: 'shows-lockout',
                    type: 'ui-state',
                    description: 'shows the lockout banner after five failures',
                  },
                ],
              },
            ],
          },
        ] as never,
      });

      const offenders = questSignoffUnknownUnitViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
      });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('nodes', () => {
    it('INVALID: {sign-off on a node id that is not on the flow} => rejected, naming the node and its flow', () => {
      const existingNode = FlowNodeStub({ id: 'login' as never });
      const existingFlow = FlowStub({ id: 'login-flow' as never, nodes: [existingNode] });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [{ id: 'loginn', flowriderSignoff: SignoffStub() }],
          },
        ] as never,
      });

      const offenders = questSignoffUnknownUnitViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
      });

      expect(offenders.map(String)).toStrictEqual([
        "Sign-off on unknown node 'loginn' — no node with that id exists on flow 'login-flow'; a sign-off may only be written on a unit that already exists, and an unknown id appends a phantom unit instead of signing the intended one",
      ]);
    });

    it('VALID: {sign-off on a node that exists on the flow} => returns empty array', () => {
      const existingNode = FlowNodeStub({ id: 'login' as never });
      const existingFlow = FlowStub({ id: 'login-flow' as never, nodes: [existingNode] });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [{ id: 'login', flowriderSignoff: SignoffStub() }],
          },
        ] as never,
      });

      const offenders = questSignoffUnknownUnitViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {brand-new node carrying NO sign-off} => returns empty array', () => {
      const existingNode = FlowNodeStub({ id: 'login' as never });
      const existingFlow = FlowStub({ id: 'login-flow' as never, nodes: [existingNode] });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [{ id: 'rate-limited', label: 'Rate Limited', type: 'state' }],
          },
        ] as never,
      });

      const offenders = questSignoffUnknownUnitViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
      });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('edges', () => {
    it('INVALID: {sign-off on an edge id that is not on the flow} => rejected, naming the edge and its flow', () => {
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
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            edges: [{ id: 'selff', siegemasterSignoff: SignoffStub() }],
          },
        ] as never,
      });

      const offenders = questSignoffUnknownUnitViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
      });

      expect(offenders.map(String)).toStrictEqual([
        "Sign-off on unknown edge 'selff' — no edge with that id exists on flow 'login-flow'; a sign-off may only be written on a unit that already exists, and an unknown id appends a phantom unit instead of signing the intended one",
      ]);
    });

    it('VALID: {sign-off on an edge that exists on the flow} => returns empty array', () => {
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
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            edges: [{ id: 'self', siegemasterSignoff: SignoffStub() }],
          },
        ] as never,
      });

      const offenders = questSignoffUnknownUnitViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
      });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('flows', () => {
    it('INVALID: {sign-off nested under a flow id that is not on the quest} => rejected once, naming the flow', () => {
      const existingFlow = FlowStub({ id: 'login-flow' as never });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'ghost-flow',
            nodes: [
              {
                id: 'login',
                observables: [{ id: 'redirects', siegemasterSignoff: SignoffStub() }],
              },
            ],
          },
        ] as never,
      });

      const offenders = questSignoffUnknownUnitViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
      });

      expect(offenders.map(String)).toStrictEqual([
        "Sign-off on unknown flow 'ghost-flow' — no flow with that id exists on this quest; a sign-off may only be written on a unit that already exists, and an unknown id appends a phantom unit instead of signing the intended one",
      ]);
    });

    it('VALID: {a whole new flow carrying NO sign-off anywhere} => returns empty array, this transformer only polices sign-offs', () => {
      const existingFlow = FlowStub({ id: 'login-flow' as never });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const newFlow = FlowStub({ id: 'ghost-flow' as never });
      const input = ModifyQuestInputStub({ flows: [newFlow] });

      const offenders = questSignoffUnknownUnitViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
      });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('off-map sign-offs', () => {
    it('INVALID: {offMapSignoffs entry on a flow id that is not on the quest} => rejected, naming the flow', () => {
      const existingFlow = FlowStub({ id: 'login-flow' as never });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'ghost-flow',
            offMapSignoffs: [{ id: 'concurrency', siegemasterSignoff: SignoffStub() }],
          },
        ] as never,
      });

      const offenders = questSignoffUnknownUnitViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
      });

      expect(offenders.map(String)).toStrictEqual([
        "Sign-off on unknown flow 'ghost-flow' — no flow with that id exists on this quest; a sign-off may only be written on a unit that already exists, and an unknown id appends a phantom unit instead of signing the intended one",
      ]);
    });

    it('VALID: {offMapSignoffs entry for a family the flow does not yet carry} => returns empty array, the family enum is closed so the entry materialises on first write', () => {
      const existingFlow = FlowStub({
        id: 'login-flow' as never,
        offMapSignoffs: [FlowOffMapSignoffStub({ id: 're-entry' })],
      });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            offMapSignoffs: [{ id: 'concurrency', siegemasterSignoff: SignoffStub() }],
          },
        ] as never,
      });

      const offenders = questSignoffUnknownUnitViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
      });

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('empty input', () => {
    it('EMPTY: {no flows in the payload} => returns empty array', () => {
      const existingFlow = FlowStub({ id: 'login-flow' as never });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const offenders = questSignoffUnknownUnitViolationsTransformer({
        inputFlows: [],
        currentQuest,
      });

      expect(offenders).toStrictEqual([]);
    });
  });
});
