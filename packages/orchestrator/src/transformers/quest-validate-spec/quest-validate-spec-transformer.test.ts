import {
  DesignDecisionStub,
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
  describe('invariants scope', () => {
    it('VALID: {default empty quest, scope invariants} => returns 9 named checks all passing', () => {
      const quest = QuestStub();

      const checks = questValidateSpecTransformer({ quest, scope: 'invariants' });

      expect(checks.map((check) => String(check.name))).toStrictEqual([
        'Flow ID Uniqueness',
        'Flow Node ID Uniqueness',
        'Flow Edge ID Uniqueness',
        'Observable ID Uniqueness Within Node',
        'Contract Name Uniqueness',
        'Design Decision ID Uniqueness',
        'Valid Flow References',
        'Contract Node Anchoring',
        'No Raw Primitives in Contracts',
      ]);
      expect(checks.every((check) => check.passed)).toBe(true);
    });

    it('INVALID: {two flows share id} => Flow ID Uniqueness fails with dynamic details naming the offender', () => {
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow' as never }), FlowStub({ id: 'login-flow' as never })],
      });

      const checks = questValidateSpecTransformer({ quest, scope: 'invariants' });

      const check = findCheck({ checks, name: 'Flow ID Uniqueness' });

      expect(check).toStrictEqual({
        name: 'Flow ID Uniqueness',
        passed: false,
        details: 'Duplicate flow ids: login-flow',
      });
    });

    it('INVALID: {edge points to ghost node} => Valid Flow References fails with offender details', () => {
      const nodeA = FlowNodeStub({ id: 'node-a' as never });
      const edge = FlowEdgeStub({
        id: 'to-ghost' as never,
        from: 'node-a' as never,
        to: 'ghost-node' as never,
      });
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow' as never, nodes: [nodeA], edges: [edge] })],
      });

      const checks = questValidateSpecTransformer({ quest, scope: 'invariants' });

      const check = findCheck({ checks, name: 'Valid Flow References' });

      expect(check).toStrictEqual({
        name: 'Valid Flow References',
        passed: false,
        details:
          "Unresolved flow refs: flow 'login-flow' edge 'to-ghost' has unresolved 'to' ref 'ghost-node'",
      });
    });

    it('INVALID: {contract property uses raw primitive} => No Raw Primitives fails with offender details', () => {
      const rawProperty = QuestContractPropertyStub({ name: 'password' as never });
      const node = FlowNodeStub({ id: 'anchor-node' as never });
      const edge = FlowEdgeStub({
        id: 'self' as never,
        from: 'anchor-node' as never,
        to: 'anchor-node' as never,
      });
      const contract = QuestContractEntryStub({
        name: 'Creds' as never,
        nodeId: 'anchor-node' as never,
      });
      const quest = QuestStub({
        flows: [FlowStub({ nodes: [node], edges: [edge] })],
        contracts: [contract],
      });
      // Bypass Zod's parse-time ban on raw 'string' to test the post-parse guard path.
      Object.assign(rawProperty, { type: 'string' });
      Object.assign(contract, { properties: [rawProperty] });
      Object.assign(quest.contracts[0] as object, { properties: [rawProperty] });

      const checks = questValidateSpecTransformer({ quest, scope: 'invariants' });

      const check = findCheck({ checks, name: 'No Raw Primitives in Contracts' });

      expect(check).toStrictEqual({
        name: 'No Raw Primitives in Contracts',
        passed: false,
        details:
          "Raw primitive contract properties: contract 'Creds' property 'password' uses raw primitive 'string'",
      });
    });
  });

  describe('flow-completeness scope', () => {
    it('VALID: {default empty quest, scope flow-completeness} => returns 4 named checks all passing', () => {
      const quest = QuestStub();

      const checks = questValidateSpecTransformer({ quest, scope: 'flow-completeness' });

      expect(checks.map((check) => String(check.name))).toStrictEqual([
        'No Orphan Flow Nodes',
        'No Dead-End Non-Terminal Nodes',
        'Decision Node Branching',
        'Decision Edge Labels',
      ]);
      expect(checks.every((check) => check.passed)).toBe(true);
    });

    it('INVALID: {orphan node} => No Orphan Flow Nodes fails with offender details', () => {
      const connected = FlowNodeStub({ id: 'connected' as never });
      const orphan = FlowNodeStub({ id: 'orphan' as never, label: 'Orphan' as never });
      const edge = FlowEdgeStub({
        id: 'e1' as never,
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

      const checks = questValidateSpecTransformer({ quest, scope: 'flow-completeness' });

      const check = findCheck({ checks, name: 'No Orphan Flow Nodes' });

      expect(check).toStrictEqual({
        name: 'No Orphan Flow Nodes',
        passed: false,
        details: "Orphan flow nodes: flow 'login-flow' has orphan node 'orphan'",
      });
    });

    it('INVALID: {decision has 1 outgoing edge} => Decision Node Branching fails with offender details', () => {
      const decision = FlowNodeStub({ id: 'check-auth' as never, type: 'decision' });
      const done = FlowNodeStub({ id: 'done' as never });
      const edge = FlowEdgeStub({
        id: 'e1' as never,
        from: 'check-auth' as never,
        to: 'done' as never,
        label: 'yes' as never,
      });
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow' as never,
            nodes: [decision, done],
            edges: [edge],
          }),
        ],
      });

      const checks = questValidateSpecTransformer({ quest, scope: 'flow-completeness' });

      const check = findCheck({ checks, name: 'Decision Node Branching' });

      expect(check).toStrictEqual({
        name: 'Decision Node Branching',
        passed: false,
        details:
          "Decision nodes missing branches: flow 'login-flow' decision 'check-auth' has 1 outgoing edges (need ≥2)",
      });
    });
  });

  describe('spec-completeness scope', () => {
    it('VALID: {default empty quest, scope spec-completeness} => returns 3 named checks all passing', () => {
      const quest = QuestStub();

      const checks = questValidateSpecTransformer({ quest, scope: 'spec-completeness' });

      expect(checks.map((check) => String(check.name))).toStrictEqual([
        'Terminal Node Observable Coverage',
        'Observable Descriptions',
        'Design Decision Rationale',
      ]);
      expect(checks.every((check) => check.passed)).toBe(true);
    });

    it('INVALID: {terminal node has no observables} => Terminal Node Observable Coverage fails with offender details', () => {
      const terminal = FlowNodeStub({
        id: 'bare-end' as never,
        type: 'terminal',
        observables: [],
      });
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow' as never, nodes: [terminal] })],
      });

      const checks = questValidateSpecTransformer({ quest, scope: 'spec-completeness' });

      const check = findCheck({ checks, name: 'Terminal Node Observable Coverage' });

      expect(check).toStrictEqual({
        name: 'Terminal Node Observable Coverage',
        passed: false,
        details:
          "Terminal nodes missing observables: flow 'login-flow' terminal node 'bare-end' has no observables",
      });
    });

    it('INVALID: {observable with empty description} => Observable Descriptions fails with offender details', () => {
      const observable = FlowObservableStub({ id: 'obs-bad' as never });
      Object.assign(observable, { description: '' });
      const node = FlowNodeStub({ id: 'done' as never, observables: [observable] });
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow' as never, nodes: [node] })],
      });

      const checks = questValidateSpecTransformer({ quest, scope: 'spec-completeness' });

      const check = findCheck({ checks, name: 'Observable Descriptions' });

      expect(check).toStrictEqual({
        name: 'Observable Descriptions',
        passed: false,
        details:
          "Observables missing description: flow 'login-flow' node 'done' observable 'obs-bad' has empty description",
      });
    });

    it('INVALID: {design decision empty rationale} => Design Decision Rationale fails with offender details', () => {
      const decision = DesignDecisionStub({ id: 'use-jwt' as never });
      Object.assign(decision, { rationale: '' });
      const quest = QuestStub({ designDecisions: [decision] });

      const checks = questValidateSpecTransformer({ quest, scope: 'spec-completeness' });

      const check = findCheck({ checks, name: 'Design Decision Rationale' });

      expect(check).toStrictEqual({
        name: 'Design Decision Rationale',
        passed: false,
        details:
          "Design decisions missing rationale: design decision 'use-jwt' has empty rationale",
      });
    });
  });
});
