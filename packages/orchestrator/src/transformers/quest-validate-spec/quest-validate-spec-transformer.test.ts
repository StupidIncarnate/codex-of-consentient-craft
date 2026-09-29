import { DesignDecisionStub } from '@dungeonmaster/shared/contracts/design-decision/design-decision.stub';
import { FlowEdgeStub } from '@dungeonmaster/shared/contracts/flow-edge/flow-edge.stub';
import { FlowNodeStub } from '@dungeonmaster/shared/contracts/flow-node/flow-node.stub';
import { FlowObservableStub } from '@dungeonmaster/shared/contracts/flow-observable/flow-observable.stub';
import { FlowStub } from '@dungeonmaster/shared/contracts/flow/flow.stub';
import { QuestContractEntryStub } from '@dungeonmaster/shared/contracts/quest-contract-entry/quest-contract-entry.stub';
import { QuestContractPropertyStub } from '@dungeonmaster/shared/contracts/quest-contract-property/quest-contract-property.stub';
import { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

import { questValidateSpecTransformer } from './quest-validate-spec-transformer';

type Check = ReturnType<typeof questValidateSpecTransformer>[0];

const findCheck = ({ checks, name }: { checks: Check[]; name: string }): Check | undefined =>
  checks.find((check) => String(check.name) === name);

describe('questValidateSpecTransformer', () => {
  describe('invariants scope', () => {
    it('VALID: {default empty quest, scope invariants} => returns 9 named checks all passing', () => {
      // The 'invariants' scope holds only write-time structural checks that must hold on every
      // modify-quest call regardless of status (uniqueness, references, no raw primitives).
      // There is no step-aware coverage check here — quest.steps no longer exists and the
      // 'completeness' scope that used to hold step-aware checks has been removed entirely.
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
        flows: [FlowStub({ id: 'login-flow' }), FlowStub({ id: 'login-flow' })],
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
      const nodeA = FlowNodeStub({ id: 'node-a' });
      const edge = FlowEdgeStub({
        id: 'to-ghost',
        from: 'node-a',
        to: 'ghost-node',
      });
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow', nodes: [nodeA], edges: [edge] })],
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
      const rawProperty = QuestContractPropertyStub({ name: 'password' });
      const node = FlowNodeStub({ id: 'anchor-node' });
      const edge = FlowEdgeStub({
        id: 'self',
        from: 'anchor-node',
        to: 'anchor-node',
      });
      const contract = QuestContractEntryStub({
        name: 'Creds',
        nodeId: 'anchor-node',
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
      const connected = FlowNodeStub({ id: 'connected' });
      const orphan = FlowNodeStub({ id: 'orphan', label: 'Orphan' });
      const edge = FlowEdgeStub({
        id: 'e1',
        from: 'connected',
        to: 'connected',
      });
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow',
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
      const decision = FlowNodeStub({ id: 'check-auth', type: 'decision' });
      const done = FlowNodeStub({ id: 'done' });
      const edge = FlowEdgeStub({
        id: 'e1',
        from: 'check-auth',
        to: 'done',
        label: 'yes',
      });
      const quest = QuestStub({
        flows: [
          FlowStub({
            id: 'login-flow',
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
        id: 'bare-end',
        type: 'terminal',
        observables: [],
      });
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow', nodes: [terminal] })],
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
      const observable = FlowObservableStub({ id: 'obs-bad' });
      Object.assign(observable, { description: '' });
      const node = FlowNodeStub({ id: 'done', observables: [observable] });
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow', nodes: [node] })],
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
      const decision = DesignDecisionStub({ id: 'use-jwt' });
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
