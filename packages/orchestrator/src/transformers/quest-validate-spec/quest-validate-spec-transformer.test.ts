import {
  DesignDecisionStub,
  DependencyStepStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestContractEntryStub,
  QuestContractPropertyStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { questValidateSpecTransformer } from './quest-validate-spec-transformer';

type Check = ReturnType<typeof questValidateSpecTransformer>[0];

const findCheck = ({ checks, name }: { checks: Check[]; name: string }): Check | undefined =>
  checks.find((check) => String(check.name) === name);

describe('questValidateSpecTransformer', () => {
  describe('check names', () => {
    it('VALID: {default quest} => returns 18 named checks in fixed order', () => {
      const quest = QuestStub();

      const checks = questValidateSpecTransformer({ quest });

      expect(checks.map((check) => String(check.name))).toStrictEqual([
        'Flow Required Fields',
        'Flow ID Uniqueness',
        'Flow Node ID Uniqueness',
        'No Orphan Flow Nodes',
        'No Dead-End Non-Terminal Nodes',
        'Decision Node Branching',
        'Decision Edge Labels',
        'Terminal Node Observable Coverage',
        'Flow Edge ID Uniqueness',
        'Valid Flow References',
        'Observable Descriptions',
        'Observable ID Uniqueness Within Node',
        'Contract Node Anchoring',
        'Contract Name Uniqueness',
        'No Raw Primitives in Contracts',
        'Design Decision ID Uniqueness',
        'Design Decision Rationale',
        'Step Focus Target',
      ]);
    });
  });

  describe('all checks pass on default quest', () => {
    it('VALID: {default empty quest} => all checks pass', () => {
      const quest = QuestStub();

      const checks = questValidateSpecTransformer({ quest });

      expect(checks.every((check) => check.passed)).toBe(true);
    });
  });

  describe('individual FAIL branches', () => {
    it('INVALID: {flow with empty exitPoints} => Flow Required Fields fails with missing-field details', () => {
      const flow = FlowStub();
      Object.assign(flow, { exitPoints: [] });
      const quest = QuestStub({ flows: [flow] });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'Flow Required Fields' });

      expect(check).toStrictEqual({
        name: 'Flow Required Fields',
        passed: false,
        details:
          'One or more flows are missing a required field (id, name, flowType, entryPoint, or exitPoints)',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {two flows with same id} => Flow ID Uniqueness fails with duplicate-id details', () => {
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow' as never }), FlowStub({ id: 'login-flow' as never })],
      });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'Flow ID Uniqueness' });

      expect(check).toStrictEqual({
        name: 'Flow ID Uniqueness',
        passed: false,
        details: 'One or more flows share the same id',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {two nodes with same id in one flow} => Flow Node ID Uniqueness fails with duplicate-node details', () => {
      const nodeA = FlowNodeStub({ id: 'same-node' as never });
      const nodeB = FlowNodeStub({ id: 'same-node' as never, label: 'Other Page' as never });
      const edge = FlowEdgeStub({ from: 'same-node' as never, to: 'same-node' as never });
      const quest = QuestStub({
        flows: [FlowStub({ nodes: [nodeA, nodeB], edges: [edge] })],
      });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'Flow Node ID Uniqueness' });

      expect(check).toStrictEqual({
        name: 'Flow Node ID Uniqueness',
        passed: false,
        details: 'One or more flows contain duplicate node IDs',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {node not referenced by any edge} => No Orphan Flow Nodes fails with orphan details', () => {
      const connectedNode = FlowNodeStub({
        id: 'connected-node' as never,
        label: 'Connected' as never,
      });
      const orphanNode = FlowNodeStub({
        id: 'orphan-node' as never,
        label: 'Orphan' as never,
      });
      const edge = FlowEdgeStub({
        from: 'connected-node' as never,
        to: 'connected-node' as never,
      });
      const quest = QuestStub({
        flows: [FlowStub({ nodes: [connectedNode, orphanNode], edges: [edge] })],
      });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'No Orphan Flow Nodes' });

      expect(check).toStrictEqual({
        name: 'No Orphan Flow Nodes',
        passed: false,
        details: 'One or more flow nodes are orphaned (not referenced by any edge)',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {non-terminal state node with no outgoing edge} => No Dead-End Non-Terminal Nodes fails', () => {
      const stateNode = FlowNodeStub({
        id: 'dead-end-state' as never,
        type: 'state',
        label: 'Dead End State' as never,
      });
      const otherNode = FlowNodeStub({
        id: 'other-node' as never,
        label: 'Other' as never,
      });
      const edge = FlowEdgeStub({
        id: 'incoming-only' as never,
        from: 'other-node' as never,
        to: 'dead-end-state' as never,
      });
      const selfEdge = FlowEdgeStub({
        id: 'other-self' as never,
        from: 'other-node' as never,
        to: 'other-node' as never,
      });
      const quest = QuestStub({
        flows: [FlowStub({ nodes: [stateNode, otherNode], edges: [edge, selfEdge] })],
      });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'No Dead-End Non-Terminal Nodes' });

      expect(check).toStrictEqual({
        name: 'No Dead-End Non-Terminal Nodes',
        passed: false,
        details:
          'One or more non-terminal nodes have zero outgoing edges (dead ends that should be terminal)',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {decision node with only 1 outgoing edge} => Decision Node Branching fails', () => {
      const decisionNode = FlowNodeStub({
        id: 'decide' as never,
        type: 'decision',
        label: 'Check Auth' as never,
      });
      const targetNode = FlowNodeStub({
        id: 'target' as never,
        type: 'terminal',
        label: 'Done' as never,
        observables: [FlowObservableStub()],
      });
      const singleEdge = FlowEdgeStub({
        id: 'decide-to-target' as never,
        from: 'decide' as never,
        to: 'target' as never,
        label: 'yes' as never,
      });
      const backEdge = FlowEdgeStub({
        id: 'target-to-decide' as never,
        from: 'target' as never,
        to: 'decide' as never,
      });
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [decisionNode, targetNode],
            edges: [singleEdge, backEdge],
          }),
        ],
      });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'Decision Node Branching' });

      expect(check).toStrictEqual({
        name: 'Decision Node Branching',
        passed: false,
        details: 'One or more decision nodes have fewer than 2 outgoing edges',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {decision edge without label} => Decision Edge Labels fails', () => {
      const decisionNode = FlowNodeStub({
        id: 'decide' as never,
        type: 'decision',
        label: 'Check Auth' as never,
      });
      const targetA = FlowNodeStub({
        id: 'target-a' as never,
        type: 'terminal',
        label: 'Target A' as never,
        observables: [FlowObservableStub()],
      });
      const targetB = FlowNodeStub({
        id: 'target-b' as never,
        type: 'terminal',
        label: 'Target B' as never,
        observables: [FlowObservableStub({ id: 'other-observable' as never })],
      });
      const labeledEdge = FlowEdgeStub({
        id: 'decide-to-a' as never,
        from: 'decide' as never,
        to: 'target-a' as never,
        label: 'yes' as never,
      });
      const unlabeledEdge = FlowEdgeStub({
        id: 'decide-to-b' as never,
        from: 'decide' as never,
        to: 'target-b' as never,
      });
      Reflect.deleteProperty(unlabeledEdge, 'label');
      const backEdgeA = FlowEdgeStub({
        id: 'a-to-decide' as never,
        from: 'target-a' as never,
        to: 'decide' as never,
      });
      const backEdgeB = FlowEdgeStub({
        id: 'b-to-decide' as never,
        from: 'target-b' as never,
        to: 'decide' as never,
      });
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [decisionNode, targetA, targetB],
            edges: [labeledEdge, unlabeledEdge, backEdgeA, backEdgeB],
          }),
        ],
      });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'Decision Edge Labels' });

      expect(check).toStrictEqual({
        name: 'Decision Edge Labels',
        passed: false,
        details: 'One or more edges leaving decision nodes are missing a label',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {terminal node with no observables} => Terminal Node Observable Coverage fails', () => {
      const terminalNode = FlowNodeStub({
        id: 'bare-terminal' as never,
        type: 'terminal',
        label: 'End' as never,
        observables: [],
      });
      const otherNode = FlowNodeStub({
        id: 'start-node' as never,
        label: 'Start' as never,
      });
      const edgeForward = FlowEdgeStub({
        id: 'start-to-end' as never,
        from: 'start-node' as never,
        to: 'bare-terminal' as never,
      });
      const edgeBack = FlowEdgeStub({
        id: 'end-to-start' as never,
        from: 'bare-terminal' as never,
        to: 'start-node' as never,
      });
      const selfEdge = FlowEdgeStub({
        id: 'start-self' as never,
        from: 'start-node' as never,
        to: 'start-node' as never,
      });
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [terminalNode, otherNode],
            edges: [edgeForward, edgeBack, selfEdge],
          }),
        ],
      });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'Terminal Node Observable Coverage' });

      expect(check).toStrictEqual({
        name: 'Terminal Node Observable Coverage',
        passed: false,
        details: 'One or more terminal nodes have no observables',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {two edges with same id in one flow} => Flow Edge ID Uniqueness fails', () => {
      const nodeA = FlowNodeStub({ id: 'node-a' as never, label: 'Node A' as never });
      const nodeB = FlowNodeStub({ id: 'node-b' as never, label: 'Node B' as never });
      const edge1 = FlowEdgeStub({
        id: 'same-edge' as never,
        from: 'node-a' as never,
        to: 'node-b' as never,
      });
      const edge2 = FlowEdgeStub({
        id: 'same-edge' as never,
        from: 'node-b' as never,
        to: 'node-a' as never,
      });
      const quest = QuestStub({
        flows: [FlowStub({ nodes: [nodeA, nodeB], edges: [edge1, edge2] })],
      });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'Flow Edge ID Uniqueness' });

      expect(check).toStrictEqual({
        name: 'Flow Edge ID Uniqueness',
        passed: false,
        details: 'One or more flows contain duplicate edge IDs',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {edge referencing non-existent node} => Valid Flow References fails', () => {
      const nodeA = FlowNodeStub({ id: 'node-a' as never, label: 'Node A' as never });
      const edgeToGhost = FlowEdgeStub({
        id: 'to-ghost' as never,
        from: 'node-a' as never,
        to: 'ghost-node' as never,
      });
      const selfEdge = FlowEdgeStub({
        id: 'self-edge' as never,
        from: 'node-a' as never,
        to: 'node-a' as never,
      });
      const quest = QuestStub({
        flows: [FlowStub({ nodes: [nodeA], edges: [edgeToGhost, selfEdge] })],
      });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'Valid Flow References' });

      expect(check).toStrictEqual({
        name: 'Valid Flow References',
        passed: false,
        details: 'One or more edges reference non-existent nodes or unresolved cross-flow refs',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {observable with empty description} => Observable Descriptions fails', () => {
      const observable = FlowObservableStub();
      Object.assign(observable, { description: '' });
      const node = FlowNodeStub({
        id: 'node-with-obs' as never,
        label: 'Has Observable' as never,
        observables: [observable],
      });
      const edge = FlowEdgeStub({
        id: 'self-ref' as never,
        from: 'node-with-obs' as never,
        to: 'node-with-obs' as never,
      });
      const quest = QuestStub({
        flows: [FlowStub({ nodes: [node], edges: [edge] })],
      });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'Observable Descriptions' });

      expect(check).toStrictEqual({
        name: 'Observable Descriptions',
        passed: false,
        details: 'One or more observables are missing a description',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {two observables with same id in one node} => Observable ID Uniqueness Within Node fails', () => {
      const obsA = FlowObservableStub({ id: 'same-obs' as never });
      const obsB = FlowObservableStub({
        id: 'same-obs' as never,
        description: 'different desc' as never,
      });
      const node = FlowNodeStub({
        id: 'node-dup-obs' as never,
        label: 'Dup Obs Node' as never,
        observables: [obsA, obsB],
      });
      const edge = FlowEdgeStub({
        id: 'self-ref' as never,
        from: 'node-dup-obs' as never,
        to: 'node-dup-obs' as never,
      });
      const quest = QuestStub({
        flows: [FlowStub({ nodes: [node], edges: [edge] })],
      });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'Observable ID Uniqueness Within Node' });

      expect(check).toStrictEqual({
        name: 'Observable ID Uniqueness Within Node',
        passed: false,
        details: 'One or more nodes contain duplicate observable IDs',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {contract nodeId points to non-existent node} => Contract Node Anchoring fails', () => {
      const quest = QuestStub({
        contracts: [QuestContractEntryStub({ nodeId: 'ghost-node' as never })],
      });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'Contract Node Anchoring' });

      expect(check).toStrictEqual({
        name: 'Contract Node Anchoring',
        passed: false,
        details:
          'One or more contracts are orphaned (nodeId points to a non-existent or deleted node)',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {two contracts with same name} => Contract Name Uniqueness fails', () => {
      const nodeA = FlowNodeStub({
        id: 'anchor-node' as never,
        label: 'Anchor' as never,
      });
      const edge = FlowEdgeStub({
        id: 'anchor-self' as never,
        from: 'anchor-node' as never,
        to: 'anchor-node' as never,
      });
      const quest = QuestStub({
        flows: [FlowStub({ nodes: [nodeA], edges: [edge] })],
        contracts: [
          QuestContractEntryStub({
            id: 'contract-a' as never,
            name: 'LoginCredentials' as never,
            nodeId: 'anchor-node' as never,
          }),
          QuestContractEntryStub({
            id: 'contract-b' as never,
            name: 'LoginCredentials' as never,
            nodeId: 'anchor-node' as never,
          }),
        ],
      });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'Contract Name Uniqueness' });

      expect(check).toStrictEqual({
        name: 'Contract Name Uniqueness',
        passed: false,
        details: 'One or more contracts share the same name',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {contract property uses raw primitive type} => No Raw Primitives in Contracts fails', () => {
      const nodeA = FlowNodeStub({
        id: 'anchor-node' as never,
        label: 'Anchor' as never,
      });
      const edge = FlowEdgeStub({
        id: 'anchor-self' as never,
        from: 'anchor-node' as never,
        to: 'anchor-node' as never,
      });
      const rawProperty = QuestContractPropertyStub();
      Object.assign(rawProperty, { type: 'any' });
      const contract = QuestContractEntryStub({
        nodeId: 'anchor-node' as never,
      });
      Object.assign(contract, { properties: [rawProperty] });
      const quest = QuestStub({
        flows: [FlowStub({ nodes: [nodeA], edges: [edge] })],
        contracts: [contract],
      });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'No Raw Primitives in Contracts' });

      expect(check).toStrictEqual({
        name: 'No Raw Primitives in Contracts',
        passed: false,
        details: 'One or more contract properties use raw primitives (string, number, etc.)',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {two design decisions with same id} => Design Decision ID Uniqueness fails', () => {
      const quest = QuestStub({
        designDecisions: [
          DesignDecisionStub({ id: 'same-decision' as never }),
          DesignDecisionStub({
            id: 'same-decision' as never,
            title: 'Another Decision' as never,
          }),
        ],
      });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'Design Decision ID Uniqueness' });

      expect(check).toStrictEqual({
        name: 'Design Decision ID Uniqueness',
        passed: false,
        details: 'One or more design decisions share the same id',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {design decision with empty rationale} => Design Decision Rationale fails', () => {
      const decision = DesignDecisionStub();
      Object.assign(decision, { rationale: '' });
      const quest = QuestStub({
        designDecisions: [decision],
      });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'Design Decision Rationale' });

      expect(check).toStrictEqual({
        name: 'Design Decision Rationale',
        passed: false,
        details: 'One or more design decisions are missing a rationale',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });

    it('INVALID: {step with both focusFile and focusAction} => Step Focus Target fails', () => {
      const step = DependencyStepStub();
      Object.assign(step, {
        focusAction: { kind: 'verification', description: 'Run ward' },
      });
      const quest = QuestStub({ steps: [step] });

      const checks = questValidateSpecTransformer({ quest });

      const check = findCheck({ checks, name: 'Step Focus Target' });

      expect(check).toStrictEqual({
        name: 'Step Focus Target',
        passed: false,
        details: 'One or more steps have neither or both focusFile and focusAction',
      });
      expect(checks.every((c) => c.passed)).toBe(false);
    });
  });

  describe('mixed failures', () => {
    it('EDGE: {quest with multiple distinct failures} => returns all failures with correct names and details', () => {
      const flow = FlowStub();
      Object.assign(flow, { exitPoints: [] });

      const decision = DesignDecisionStub();
      Object.assign(decision, { rationale: '' });

      const contract = QuestContractEntryStub({ nodeId: 'nonexistent-node' as never });

      const step = DependencyStepStub();
      Object.assign(step, {
        focusAction: { kind: 'verification', description: 'Run ward' },
      });

      const quest = QuestStub({
        flows: [flow],
        designDecisions: [decision],
        contracts: [contract],
        steps: [step],
      });

      const checks = questValidateSpecTransformer({ quest });

      const flowRequiredFields = findCheck({ checks, name: 'Flow Required Fields' });

      expect(flowRequiredFields).toStrictEqual({
        name: 'Flow Required Fields',
        passed: false,
        details:
          'One or more flows are missing a required field (id, name, flowType, entryPoint, or exitPoints)',
      });

      const designRationale = findCheck({ checks, name: 'Design Decision Rationale' });

      expect(designRationale).toStrictEqual({
        name: 'Design Decision Rationale',
        passed: false,
        details: 'One or more design decisions are missing a rationale',
      });

      const contractAnchoring = findCheck({ checks, name: 'Contract Node Anchoring' });

      expect(contractAnchoring).toStrictEqual({
        name: 'Contract Node Anchoring',
        passed: false,
        details:
          'One or more contracts are orphaned (nodeId points to a non-existent or deleted node)',
      });

      const stepFocus = findCheck({ checks, name: 'Step Focus Target' });

      expect(stepFocus).toStrictEqual({
        name: 'Step Focus Target',
        passed: false,
        details: 'One or more steps have neither or both focusFile and focusAction',
      });

      const failedCheckNames = checks
        .filter((check) => !check.passed)
        .map((check) => String(check.name));

      expect(failedCheckNames).toStrictEqual([
        'Flow Required Fields',
        'Contract Node Anchoring',
        'Design Decision Rationale',
        'Step Focus Target',
      ]);
    });
  });
});
