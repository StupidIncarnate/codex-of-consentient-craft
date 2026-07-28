import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  ModifyQuestInputStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { questFlowAdditiveOnlyViolationsTransformer } from './quest-flow-additive-only-violations-transformer';

describe('questFlowAdditiveOnlyViolationsTransformer', () => {
  it('VALID: {replace existing observable wording on existing node} => returns empty array', () => {
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
    const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

    const replacementObservable = FlowObservableStub({
      id: 'redirects' as never,
      description: 'redirects to /home' as never,
    });
    const replacementNode = FlowNodeStub({
      id: 'login' as never,
      observables: [replacementObservable],
    });
    const replacementFlow = FlowStub({
      id: 'login-flow' as never,
      nodes: [replacementNode],
    });
    const input = ModifyQuestInputStub({ flows: [replacementFlow] });

    const offenders = questFlowAdditiveOnlyViolationsTransformer({
      inputFlows: input.flows!,
      currentQuest,
      currentStatus: 'in_progress',
    });

    expect(offenders).toStrictEqual([]);
  });

  it('VALID: {add a new node and a new edge to an EXISTING flow} => allowed, the agent recorded a branch it found', () => {
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

    const newNode = FlowNodeStub({ id: 'rate-limited' as never });
    const newEdge = FlowEdgeStub({
      id: 'login-to-rate-limited' as never,
      from: 'login' as never,
      to: 'rate-limited' as never,
    });
    const updateFlow = FlowStub({
      id: 'login-flow' as never,
      nodes: [newNode],
      edges: [newEdge],
    });
    const input = ModifyQuestInputStub({ flows: [updateFlow] });

    const offenders = questFlowAdditiveOnlyViolationsTransformer({
      inputFlows: input.flows!,
      currentQuest,
      currentStatus: 'in_progress',
    });

    expect(offenders).toStrictEqual([]);
  });

  it('VALID: {add a new observable to an existing node} => allowed, adding only constrains the agent further', () => {
    const existingNode = FlowNodeStub({ id: 'login' as never, observables: [] });
    const existingFlow = FlowStub({ id: 'login-flow' as never, nodes: [existingNode] });
    const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

    const addedObservable = FlowObservableStub({ id: 'shows-lockout' as never });
    const updateNode = FlowNodeStub({ id: 'login' as never, observables: [addedObservable] });
    const updateFlow = FlowStub({ id: 'login-flow' as never, nodes: [updateNode] });
    const input = ModifyQuestInputStub({ flows: [updateFlow] });

    const offenders = questFlowAdditiveOnlyViolationsTransformer({
      inputFlows: input.flows!,
      currentQuest,
      currentStatus: 'in_progress',
    });

    expect(offenders).toStrictEqual([]);
  });

  it('INVALID: {flow add to empty quest} => rejects a whole new flow, which would be a new acceptance target', () => {
    const currentQuest = QuestStub({ status: 'in_progress', flows: [] });
    const newFlow = FlowStub({ id: 'new-flow' as never });
    const input = ModifyQuestInputStub({ flows: [newFlow] });

    const offenders = questFlowAdditiveOnlyViolationsTransformer({
      inputFlows: input.flows!,
      currentQuest,
      currentStatus: 'in_progress',
    });

    expect(offenders.map(String)).toStrictEqual([
      "Flow add not allowed in status 'in_progress' (attempted to add flow 'new-flow') — you may add nodes, edges, and observables to an EXISTING flow, but not a new flow",
    ]);
  });

  it('INVALID: {flow delete on existing flow} => rejects flow delete', () => {
    const existingFlow = FlowStub({ id: 'login-flow' as never });
    const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });
    const input = ModifyQuestInputStub({
      flows: [{ id: 'login-flow', _delete: true }] as never,
    });

    const offenders = questFlowAdditiveOnlyViolationsTransformer({
      inputFlows: input.flows!,
      currentQuest,
      currentStatus: 'in_progress',
    });

    expect(offenders.map(String)).toStrictEqual([
      "Flow delete not allowed in status 'in_progress' (attempted to delete flow 'login-flow')",
    ]);
  });

  it('INVALID: {observable delete on existing observable} => rejects observable delete', () => {
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

    const offenders = questFlowAdditiveOnlyViolationsTransformer({
      inputFlows: input.flows!,
      currentQuest,
      currentStatus: 'in_progress',
    });

    expect(offenders.map(String)).toStrictEqual([
      "Observable delete not allowed in status 'in_progress' (attempted to delete observable 'redirects' from node 'login' in flow 'login-flow') — you may add observables, never remove one",
    ]);
  });

  it('INVALID: {node delete and edge delete on existing flow} => rejects both', () => {
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
          name: 'Login Flow',
          flowType: 'runtime',
          entryPoint: '/login',
          exitPoints: ['/dashboard'],
          nodes: [{ id: 'login', _delete: true }],
          edges: [{ id: 'self', _delete: true }],
        },
      ] as never,
    });

    const offenders = questFlowAdditiveOnlyViolationsTransformer({
      inputFlows: input.flows!,
      currentQuest,
      currentStatus: 'in_progress',
    });

    expect(offenders.map(String)).toStrictEqual([
      "Node delete not allowed in status 'in_progress' (attempted to delete node 'login' from flow 'login-flow')",
      "Edge delete not allowed in status 'in_progress' (attempted to delete edge 'self' from flow 'login-flow')",
    ]);
  });
});
