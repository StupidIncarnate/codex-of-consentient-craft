import {
  DependencyStepStub,
  DesignDecisionStub,
  FlowEdgeStub,
  FlowNodeStub,
  FlowObservableStub,
  FlowStub,
  QuestContractEntryStub,
  QuestContractPropertyStub,
  QuestStub,
  StepAssertionStub,
} from '@dungeonmaster/shared/contracts';

import { questValidateSpecTransformer } from './quest-validate-spec-transformer';

type Check = ReturnType<typeof questValidateSpecTransformer>[0];

const findCheck = ({ checks, name }: { checks: Check[]; name: string }): Check | undefined =>
  checks.find((check) => String(check.name) === name);

describe('questValidateSpecTransformer', () => {
  describe('invariants scope', () => {
    it('VALID: {default empty quest, scope invariants} => returns 13 named checks all passing', () => {
      // The 'invariants' scope no longer includes V4/V7/V8 — those are step-aware
      // coverage checks that fire prematurely during slice-by-slice seek_synth
      // commits and now live in the 'completeness' scope (run only on transition
      // to in_progress). The remaining 13 invariants are safe to run on every
      // modify-quest call regardless of how much of the plan is committed.
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
        'Step Slice Prefix Match',
        'Step Focus File Uniqueness',
        'Assertion Banned Matchers',
        'Step Companion File Completeness',
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

    it('VALID: {step id prefixed with slice} => Step Slice Prefix Match passes', () => {
      const step = DependencyStepStub({
        id: 'backend-create-login-api' as never,
        slice: 'backend' as never,
      });
      const quest = QuestStub({ steps: [step] });

      const checks = questValidateSpecTransformer({ quest, scope: 'invariants' });

      const check = findCheck({ checks, name: 'Step Slice Prefix Match' });

      expect(check).toStrictEqual({
        name: 'Step Slice Prefix Match',
        passed: true,
        details: "All step IDs are prefixed with their slice's name followed by a dash",
      });
    });

    it('INVALID: {step id missing slice prefix} => Step Slice Prefix Match fails with offender details', () => {
      const step = DependencyStepStub({
        id: 'create-login-api' as never,
        slice: 'backend' as never,
      });
      const quest = QuestStub({ steps: [step] });

      const checks = questValidateSpecTransformer({ quest, scope: 'invariants' });

      const check = findCheck({ checks, name: 'Step Slice Prefix Match' });

      expect(check).toStrictEqual({
        name: 'Step Slice Prefix Match',
        passed: false,
        details:
          "Step slice prefix mismatches: step 'create-login-api' has slice 'backend' but id does not start with 'backend-'",
      });
    });

    it('VALID: {two steps with distinct focusFile paths} => Step Focus File Uniqueness passes', () => {
      const stepA = DependencyStepStub({
        id: 'backend-create-login-broker' as never,
        slice: 'backend' as never,
        focusFile: {
          path: 'packages/orchestrator/src/brokers/login/create/login-create-broker.ts' as never,
        },
        accompanyingFiles: [
          {
            path: 'packages/orchestrator/src/brokers/login/create/login-create-broker.proxy.ts' as never,
          },
        ],
      });
      const stepB = DependencyStepStub({
        id: 'backend-create-logout-broker' as never,
        slice: 'backend' as never,
        focusFile: {
          path: 'packages/orchestrator/src/brokers/logout/create/logout-create-broker.ts' as never,
        },
        accompanyingFiles: [
          {
            path: 'packages/orchestrator/src/brokers/logout/create/logout-create-broker.proxy.ts' as never,
          },
        ],
      });
      const quest = QuestStub({ steps: [stepA, stepB] });

      const checks = questValidateSpecTransformer({ quest, scope: 'invariants' });

      const check = findCheck({ checks, name: 'Step Focus File Uniqueness' });

      expect(check).toStrictEqual({
        name: 'Step Focus File Uniqueness',
        passed: true,
        details: 'All file-anchored steps target distinct focusFile paths',
      });
    });

    it('INVALID: {two steps share focusFile path} => Step Focus File Uniqueness fails with offender details', () => {
      const sharedPath = 'packages/orchestrator/src/brokers/login/create/login-create-broker.ts';
      const stepA = DependencyStepStub({
        id: 'backend-create-login-broker' as never,
        slice: 'backend' as never,
        focusFile: { path: sharedPath as never },
        accompanyingFiles: [
          {
            path: 'packages/orchestrator/src/brokers/login/create/login-create-broker.proxy.ts' as never,
          },
        ],
      });
      const stepB = DependencyStepStub({
        id: 'frontend-write-login-broker' as never,
        slice: 'frontend' as never,
        focusFile: { path: sharedPath as never },
        accompanyingFiles: [
          {
            path: 'packages/orchestrator/src/brokers/login/create/login-create-broker.proxy.ts' as never,
          },
        ],
      });
      const quest = QuestStub({ steps: [stepA, stepB] });

      const checks = questValidateSpecTransformer({ quest, scope: 'invariants' });

      const check = findCheck({ checks, name: 'Step Focus File Uniqueness' });

      expect(check).toStrictEqual({
        name: 'Step Focus File Uniqueness',
        passed: false,
        details: `Duplicate step focusFile paths: ${sharedPath}`,
      });
    });

    it('VALID: {assertion text uses no banned matchers} => Assertion Banned Matchers passes', () => {
      const step = DependencyStepStub({
        id: 'backend-create-login-broker' as never,
        slice: 'backend' as never,
        assertions: [
          StepAssertionStub({
            prefix: 'VALID',
            input: '{valid creds}',
            expected: 'returns session',
          }),
        ],
      });
      const quest = QuestStub({ steps: [step] });

      const checks = questValidateSpecTransformer({ quest, scope: 'invariants' });

      const check = findCheck({ checks, name: 'Assertion Banned Matchers' });

      expect(check).toStrictEqual({
        name: 'Assertion Banned Matchers',
        passed: true,
        details: 'No step assertion input/expected text contains banned jest matcher syntax',
      });
    });

    it('INVALID: {assertion expected text contains .toEqual(} => Assertion Banned Matchers fails with offender details', () => {
      const step = DependencyStepStub({
        id: 'backend-create-login-broker' as never,
        slice: 'backend' as never,
        assertions: [
          StepAssertionStub({
            prefix: 'VALID',
            input: '{valid creds}',
            expected: 'result.toEqual({ ok: true })',
          }),
        ],
      });
      const quest = QuestStub({ steps: [step] });

      const checks = questValidateSpecTransformer({ quest, scope: 'invariants' });

      const check = findCheck({ checks, name: 'Assertion Banned Matchers' });

      expect(check).toStrictEqual({
        name: 'Assertion Banned Matchers',
        passed: false,
        details:
          "Assertion banned matchers: step 'backend-create-login-broker' assertion VALID expected uses banned matcher '.toEqual('",
      });
    });

    it('VALID: {brokers step includes .proxy.ts companion} => Step Companion File Completeness passes', () => {
      const step = DependencyStepStub({
        id: 'backend-create-login-broker' as never,
        slice: 'backend' as never,
        focusFile: {
          path: 'packages/orchestrator/src/brokers/login/create/login-create-broker.ts' as never,
        },
        accompanyingFiles: [
          {
            path: 'packages/orchestrator/src/brokers/login/create/login-create-broker.proxy.ts' as never,
          },
        ],
      });
      const quest = QuestStub({ steps: [step] });

      const checks = questValidateSpecTransformer({ quest, scope: 'invariants' });

      const check = findCheck({ checks, name: 'Step Companion File Completeness' });

      expect(check).toStrictEqual({
        name: 'Step Companion File Completeness',
        passed: true,
        details:
          'All file-anchored steps include the companion files required by their folder type',
      });
    });

    it('INVALID: {adapters step missing .proxy.ts companion} => Step Companion File Completeness fails with offender details', () => {
      const step = DependencyStepStub({
        id: 'backend-create-axios-get-adapter' as never,
        slice: 'backend' as never,
        focusFile: {
          path: 'packages/orchestrator/src/adapters/axios/get/axios-get-adapter.ts' as never,
        },
        accompanyingFiles: [
          {
            path: 'packages/orchestrator/src/adapters/axios/get/axios-get-adapter.test.ts' as never,
          },
        ],
      });
      const quest = QuestStub({ steps: [step] });

      const checks = questValidateSpecTransformer({ quest, scope: 'invariants' });

      const check = findCheck({ checks, name: 'Step Companion File Completeness' });

      expect(check).toStrictEqual({
        name: 'Step Companion File Completeness',
        passed: false,
        details:
          "Step companion file mismatches: step 'backend-create-axios-get-adapter' is missing required companion '.proxy.ts' for folder type 'adapters' (expected 'packages/orchestrator/src/adapters/axios/get/axios-get-adapter.proxy.ts')",
      });
    });
  });

  describe('completeness scope', () => {
    it('VALID: {default empty quest, scope completeness} => returns 3 named checks all passing', () => {
      // The 'completeness' scope holds whole-quest coverage checks (V4/V7/V8) that
      // only fire on transition to in_progress. With no steps and no contracts,
      // an empty quest passes all three vacuously.
      const quest = QuestStub();

      const checks = questValidateSpecTransformer({ quest, scope: 'completeness' });

      expect(checks.map((check) => String(check.name))).toStrictEqual([
        'Step Contract References Resolve',
        'New Contracts Have Creating Step',
        'Observables Are Satisfied',
      ]);
      expect(checks.every((check) => check.passed)).toBe(true);
    });

    it('VALID: {step inputContracts/outputContracts use Void only} => Step Contract References Resolve passes', () => {
      const step = DependencyStepStub({
        id: 'backend-create-login-broker' as never,
        slice: 'backend' as never,
        inputContracts: ['Void' as never],
        outputContracts: ['Void' as never],
      });
      const quest = QuestStub({ steps: [step] });

      const checks = questValidateSpecTransformer({ quest, scope: 'completeness' });

      const check = findCheck({ checks, name: 'Step Contract References Resolve' });

      expect(check).toStrictEqual({
        name: 'Step Contract References Resolve',
        passed: true,
        details: 'All step inputContracts and outputContracts resolve to a quest contract or Void',
      });
    });

    it('INVALID: {step references unknown contract} => Step Contract References Resolve fails with offender details', () => {
      const step = DependencyStepStub({
        id: 'backend-create-login-broker' as never,
        slice: 'backend' as never,
        inputContracts: ['GhostContract' as never],
        outputContracts: ['Void' as never],
      });
      const quest = QuestStub({ steps: [step] });

      const checks = questValidateSpecTransformer({ quest, scope: 'completeness' });

      const check = findCheck({ checks, name: 'Step Contract References Resolve' });

      expect(check).toStrictEqual({
        name: 'Step Contract References Resolve',
        passed: false,
        details:
          "Unresolved step contract refs: step 'backend-create-login-broker' inputContracts references unknown contract 'GhostContract'",
      });
    });

    it("VALID: {contract status 'new' is produced by a step} => New Contracts Have Creating Step passes", () => {
      const node = FlowNodeStub({ id: 'anchor-node' as never });
      const edge = FlowEdgeStub({
        id: 'self' as never,
        from: 'anchor-node' as never,
        to: 'anchor-node' as never,
      });
      const contract = QuestContractEntryStub({
        name: 'LoginCredentials' as never,
        nodeId: 'anchor-node' as never,
      });
      const step = DependencyStepStub({
        id: 'backend-create-login-broker' as never,
        slice: 'backend' as never,
        outputContracts: ['LoginCredentials' as never],
      });
      const quest = QuestStub({
        flows: [FlowStub({ nodes: [node], edges: [edge] })],
        contracts: [contract],
        steps: [step],
      });

      const checks = questValidateSpecTransformer({ quest, scope: 'completeness' });

      const check = findCheck({ checks, name: 'New Contracts Have Creating Step' });

      expect(check).toStrictEqual({
        name: 'New Contracts Have Creating Step',
        passed: true,
        details: "Every contract with status 'new' is produced by at least one step",
      });
    });

    it("INVALID: {contract status 'new' has no producing step} => New Contracts Have Creating Step fails with offender details", () => {
      const node = FlowNodeStub({ id: 'anchor-node' as never });
      const edge = FlowEdgeStub({
        id: 'self' as never,
        from: 'anchor-node' as never,
        to: 'anchor-node' as never,
      });
      const contract = QuestContractEntryStub({
        name: 'LoginCredentials' as never,
        nodeId: 'anchor-node' as never,
        source:
          'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts' as never,
      });
      const quest = QuestStub({
        flows: [FlowStub({ nodes: [node], edges: [edge] })],
        contracts: [contract],
      });

      const checks = questValidateSpecTransformer({ quest, scope: 'completeness' });

      const check = findCheck({ checks, name: 'New Contracts Have Creating Step' });

      expect(check).toStrictEqual({
        name: 'New Contracts Have Creating Step',
        passed: false,
        details:
          "Orphan new contracts: contract 'LoginCredentials' (source 'packages/shared/src/contracts/login-credentials/login-credentials-contract.ts') has status 'new' but is not produced by any step's outputContracts",
      });
    });

    it('VALID: {observable claimed by a step} => Observables Are Satisfied passes', () => {
      const observable = FlowObservableStub({ id: 'login-redirects-to-dashboard' as never });
      const node = FlowNodeStub({
        id: 'login-page' as never,
        observables: [observable],
      });
      const step = DependencyStepStub({
        id: 'backend-create-login-broker' as never,
        slice: 'backend' as never,
        observablesSatisfied: ['login-redirects-to-dashboard' as never],
      });
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow' as never, nodes: [node] })],
        steps: [step],
      });

      const checks = questValidateSpecTransformer({ quest, scope: 'completeness' });

      const check = findCheck({ checks, name: 'Observables Are Satisfied' });

      expect(check).toStrictEqual({
        name: 'Observables Are Satisfied',
        passed: true,
        details: 'Every flow-node observable is claimed by a step or assertion',
      });
    });

    it('INVALID: {observable claimed by no step or assertion} => Observables Are Satisfied fails with offender details', () => {
      const observable = FlowObservableStub({ id: 'login-redirects-to-dashboard' as never });
      const node = FlowNodeStub({
        id: 'login-page' as never,
        observables: [observable],
      });
      const quest = QuestStub({
        flows: [FlowStub({ id: 'login-flow' as never, nodes: [node] })],
      });

      const checks = questValidateSpecTransformer({ quest, scope: 'completeness' });

      const check = findCheck({ checks, name: 'Observables Are Satisfied' });

      expect(check).toStrictEqual({
        name: 'Observables Are Satisfied',
        passed: false,
        details:
          "Unsatisfied observables: observable 'login-redirects-to-dashboard' (flow 'login-flow', node 'login-page') is not claimed by any step.observablesSatisfied or step.assertions[].observablesSatisfied",
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
