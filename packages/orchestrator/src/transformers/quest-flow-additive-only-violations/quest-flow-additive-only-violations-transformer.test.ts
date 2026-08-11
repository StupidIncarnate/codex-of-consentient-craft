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

  describe('sign-off scoping: an element that signs may write nothing else about itself', () => {
    it('INVALID: {observable patch carrying a siegemasterSignoff AND a description edit} => rejected, naming the observable and the description field', () => {
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
                observables: [
                  {
                    id: 'redirects',
                    description: 'redirects to /home instead',
                    siegemasterSignoff: SignoffStub(),
                  },
                ],
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
        "Observable edit alongside a sign-off not allowed in status 'in_progress' (attempted to write field 'description' on observable 'redirects' from node 'login' in flow 'login-flow' in the same patch as a sign-off) — a sign-off patch may carry only 'id' and the sign-off fields",
      ]);
    });

    it('VALID: {observable patch carrying only id and flowriderSignoff} => returns empty array', () => {
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
                observables: [{ id: 'redirects', flowriderSignoff: SignoffStub() }],
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

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {observable patch carrying BOTH sign-off fields and nothing else} => returns empty array, the two tracks may land together', () => {
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
                observables: [
                  {
                    id: 'redirects',
                    flowriderSignoff: SignoffStub(),
                    siegemasterSignoff: SignoffStub({
                      evidence: 'walked it against the dev server',
                    }),
                  },
                ],
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

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {one flow patch signing three observables across two nodes AND adding a brand-new observable on a third node} => returns empty array, the rule is scoped per element not per payload', () => {
      const nodeA = FlowNodeStub({
        id: 'node-a' as never,
        observables: [
          FlowObservableStub({ id: 'obs-a-one' as never }),
          FlowObservableStub({ id: 'obs-a-two' as never }),
        ],
      });
      const nodeB = FlowNodeStub({
        id: 'node-b' as never,
        observables: [FlowObservableStub({ id: 'obs-b-one' as never })],
      });
      const nodeC = FlowNodeStub({ id: 'node-c' as never, observables: [] });
      const existingFlow = FlowStub({
        id: 'login-flow' as never,
        nodes: [nodeA, nodeB, nodeC],
      });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [
              {
                id: 'node-a',
                observables: [
                  { id: 'obs-a-one', flowriderSignoff: SignoffStub() },
                  { id: 'obs-a-two', flowriderSignoff: SignoffStub() },
                ],
              },
              {
                id: 'node-b',
                observables: [{ id: 'obs-b-one', flowriderSignoff: SignoffStub() }],
              },
              {
                id: 'node-c',
                observables: [
                  {
                    id: 'obs-c-new',
                    type: 'ui-state',
                    description: 'shows the retry banner after a failed submit',
                  },
                ],
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

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {node patch carrying a sign-off plus a label edit} => rejected, naming the node and the label field', () => {
      const existingNode = FlowNodeStub({ id: 'login' as never });
      const existingFlow = FlowStub({ id: 'login-flow' as never, nodes: [existingNode] });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            nodes: [{ id: 'login', label: 'Renamed Login', siegemasterSignoff: SignoffStub() }],
          },
        ] as never,
      });

      const offenders = questFlowAdditiveOnlyViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders.map(String)).toStrictEqual([
        "Node edit alongside a sign-off not allowed in status 'in_progress' (attempted to write field 'label' on node 'login' in flow 'login-flow' in the same patch as a sign-off) — a sign-off patch may carry only 'id' and the sign-off fields",
      ]);
    });

    it('VALID: {node patch carrying a sign-off plus its observables container} => returns empty array, the container is not content of the node being signed', () => {
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
                flowriderSignoff: SignoffStub(),
                observables: [{ id: 'redirects', flowriderSignoff: SignoffStub() }],
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

      expect(offenders).toStrictEqual([]);
    });

    it('INVALID: {edge patch carrying a sign-off plus a label edit} => rejected, naming the edge and the label field', () => {
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
            edges: [{ id: 'self', label: 'retry', siegemasterSignoff: SignoffStub() }],
          },
        ] as never,
      });

      const offenders = questFlowAdditiveOnlyViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders.map(String)).toStrictEqual([
        "Edge edit alongside a sign-off not allowed in status 'in_progress' (attempted to write field 'label' on edge 'self' from flow 'login-flow' in the same patch as a sign-off) — a sign-off patch may carry only 'id' and the sign-off fields",
      ]);
    });

    it('INVALID: {offMapSignoffs entry carrying a sign-off plus an extra field} => rejected, naming the family and the extra field', () => {
      const existingFlow = FlowStub({
        id: 'login-flow' as never,
        offMapSignoffs: [FlowOffMapSignoffStub({ id: 'concurrency' })],
      });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      // The input contract strips unknown keys, so the only way to hand this element an extra field
      // is to build the flows array directly — the rule is what keeps the element defensible if a
      // future field lands on the off-map shape.
      const offenders = questFlowAdditiveOnlyViolationsTransformer({
        inputFlows: [
          {
            id: 'login-flow',
            offMapSignoffs: [
              {
                id: 'concurrency',
                note: 'double-submitted twice',
                siegemasterSignoff: SignoffStub(),
              },
            ],
          },
        ] as never,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders.map(String)).toStrictEqual([
        "Off-map family edit alongside a sign-off not allowed in status 'in_progress' (attempted to write field 'note' on off-map family 'concurrency' in flow 'login-flow' in the same patch as a sign-off) — a sign-off patch may carry only 'id' and the sign-off fields",
      ]);
    });

    it('VALID: {offMapSignoffs entry carrying only id and a sign-off} => returns empty array', () => {
      const existingFlow = FlowStub({ id: 'login-flow' as never });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'login-flow',
            offMapSignoffs: [{ id: 'concurrency', siegemasterSignoff: SignoffStub() }],
          },
        ] as never,
      });

      const offenders = questFlowAdditiveOnlyViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {payload rewording an observable with NO sign-off anywhere} => returns empty array, the reword allowance is untouched', () => {
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
                label: 'Renamed Login',
                observables: [{ id: 'redirects', description: 'redirects to /home instead' }],
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

      expect(offenders).toStrictEqual([]);
    });
  });

  describe('package tags are frozen past approval', () => {
    it('INVALID: {node patch carrying only id and packages} => refuses the retag and says dispatch slicing was computed from the old tags', () => {
      const existingNode = FlowNodeStub({ id: 'press-warp', packages: ['web'] });
      const existingFlow = FlowStub({ id: 'warpgate-merge', nodes: [existingNode] });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          { id: 'warpgate-merge', nodes: [{ id: 'press-warp', packages: ['web', 'server'] }] },
        ] as never,
      });

      const offenders = questFlowAdditiveOnlyViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Node package retag not allowed in status 'in_progress' (attempted to write 'packages' on node 'press-warp' in flow 'warpgate-merge') — package tags are frozen at approval because dispatch slicing is computed from them, so a mid-flight retag silently invalidates the scope every session in the relay was given",
      ]);
    });

    it('INVALID: {the batched sign-off shape the coverage minion writes, carrying packages} => the freeze rule AND the sign-off rule both name the field', () => {
      const existingNode = FlowNodeStub({ id: 'press-warp', packages: ['web'] });
      const existingFlow = FlowStub({ id: 'warpgate-merge', nodes: [existingNode] });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'warpgate-merge',
            nodes: [
              {
                id: 'press-warp',
                flowriderSignoff: SignoffStub(),
                packages: ['server'],
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

      expect(offenders.map((offender) => String(offender))).toStrictEqual([
        "Node package retag not allowed in status 'in_progress' (attempted to write 'packages' on node 'press-warp' in flow 'warpgate-merge') — package tags are frozen at approval because dispatch slicing is computed from them, so a mid-flight retag silently invalidates the scope every session in the relay was given",
        "Node edit alongside a sign-off not allowed in status 'in_progress' (attempted to write field 'packages' on node 'press-warp' in flow 'warpgate-merge' in the same patch as a sign-off) — a sign-off patch may carry only 'id' and the sign-off fields",
      ]);
    });

    it('VALID: {full-node patch restating the tag the node already carries} => not a retag, returns empty array', () => {
      const existingNode = FlowNodeStub({ id: 'press-warp', packages: ['web'] });
      const existingFlow = FlowStub({ id: 'warpgate-merge', nodes: [existingNode] });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          { id: 'warpgate-merge', nodes: [{ id: 'press-warp', packages: ['web'] }] },
        ] as never,
      });

      const offenders = questFlowAdditiveOnlyViolationsTransformer({
        inputFlows: input.flows!,
        currentQuest,
        currentStatus: 'in_progress',
      });

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {node patch adding an observable and no packages key} => returns empty array', () => {
      const existingNode = FlowNodeStub({ id: 'press-warp', packages: ['web'] });
      const existingFlow = FlowStub({ id: 'warpgate-merge', nodes: [existingNode] });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'warpgate-merge',
            nodes: [
              {
                id: 'press-warp',
                observables: [
                  { id: 'warp-button-disables', type: 'ui-state', description: 'disables' },
                ],
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

      expect(offenders).toStrictEqual([]);
    });

    it('VALID: {a brand-new node authored with its packages tag} => allowed, it has no prior tag to invalidate', () => {
      const existingNode = FlowNodeStub({ id: 'press-warp', packages: ['web'] });
      const existingFlow = FlowStub({ id: 'warpgate-merge', nodes: [existingNode] });
      const currentQuest = QuestStub({ status: 'in_progress', flows: [existingFlow] });

      const input = ModifyQuestInputStub({
        flows: [
          {
            id: 'warpgate-merge',
            nodes: [
              {
                id: 'merge-status-ok',
                label: 'Merge status OK',
                type: 'state',
                packages: ['server'],
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

      expect(offenders).toStrictEqual([]);
    });
  });
});
