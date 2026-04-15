import {
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { ModifyQuestInputStub } from '../../contracts/modify-quest-input/modify-quest-input.stub';

import { questFlowWordingOnlyViolationsTransformer } from './quest-flow-wording-only-violations-transformer';

describe('questFlowWordingOnlyViolationsTransformer', () => {
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

    const offenders = questFlowWordingOnlyViolationsTransformer({
      inputFlows: input.flows!,
      currentQuest,
      currentStatus: 'in_progress',
    });

    expect(offenders).toStrictEqual([]);
  });

  it('INVALID: {flow add to empty quest} => rejects flow add', () => {
    const currentQuest = QuestStub({ status: 'in_progress', flows: [] });
    const newFlow = FlowStub({ id: 'new-flow' as never });
    const input = ModifyQuestInputStub({ flows: [newFlow] });

    const offenders = questFlowWordingOnlyViolationsTransformer({
      inputFlows: input.flows!,
      currentQuest,
      currentStatus: 'in_progress',
    });

    expect(offenders.map((o) => String(o))).toStrictEqual([
      "Flow add not allowed in status 'in_progress' (attempted to add flow 'new-flow')",
    ]);
  });

  it('INVALID: {flow delete on existing flow} => rejects flow delete', () => {
    const existingFlow = FlowStub({ id: 'login-flow' as never });
    const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });
    const input = ModifyQuestInputStub({
      flows: [{ id: 'login-flow', _delete: true }] as never,
    });

    const offenders = questFlowWordingOnlyViolationsTransformer({
      inputFlows: input.flows!,
      currentQuest,
      currentStatus: 'in_progress',
    });

    expect(offenders.map((o) => String(o))).toStrictEqual([
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

    const offenders = questFlowWordingOnlyViolationsTransformer({
      inputFlows: input.flows!,
      currentQuest,
      currentStatus: 'in_progress',
    });

    expect(offenders.map((o) => String(o))).toStrictEqual([
      "Observable delete not allowed in status 'in_progress' (attempted to delete observable 'redirects' from node 'login' in flow 'login-flow') — only wording replacement on existing observables",
    ]);
  });

  it('INVALID: {add new node and new edge to existing flow} => rejects both', () => {
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

    const offenders = questFlowWordingOnlyViolationsTransformer({
      inputFlows: input.flows!,
      currentQuest,
      currentStatus: 'in_progress',
    });

    expect(offenders.map((o) => String(o))).toStrictEqual([
      "Node add not allowed in status 'in_progress' (attempted to add node 'new-node' to flow 'login-flow')",
      "Edge add not allowed in status 'in_progress' (attempted to add edge 'new-edge' to flow 'login-flow')",
    ]);
  });
});
