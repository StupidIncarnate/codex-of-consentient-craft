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
    it('VALID: {retired sign-off on an observable id not on node} => returns empty array because sign-off fields are retired', () => {
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

      expect(offenders).toStrictEqual([]);
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

    it('VALID: {retired sign-off on observable on different node} => returns empty array because sign-off fields are retired', () => {
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

      expect(offenders).toStrictEqual([]);
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
    it('VALID: {retired sign-off on node id not on flow} => returns empty array because sign-off fields are retired', () => {
      const existingNode = FlowNodeStub({ id: 'login' as never });
      const existingFlow = FlowStub({ id: 'login-flow' as never, nodes: [existingNode] });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [{ id: 'loginn' }],
          },
        ] as never,
      });

      const offenders = questSignoffUnknownUnitViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {node that exists on the flow} => returns empty array', () => {
      const existingNode = FlowNodeStub({ id: 'login' as never });
      const existingFlow = FlowStub({ id: 'login-flow' as never, nodes: [existingNode] });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [{ id: 'login' }],
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
    it('VALID: {retired sign-off on edge id not on flow} => returns empty array because sign-off fields are retired', () => {
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

      expect(offenders).toStrictEqual([]);
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
    it('VALID: {retired sign-off nested under unknown flow id} => returns empty array because sign-off fields are retired', () => {
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

      expect(offenders).toStrictEqual([]);
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
    it('VALID: {offMapSignoffs entry on unknown flow id with retired sign-off} => returns empty array because sign-off fields are retired', () => {
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

      expect(offenders).toStrictEqual([]);
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
