import {
  QuestStub,
  DependencyStepStub,
  StepIdStub,
  QuestContractEntryStub,
  QuestContractPropertyStub,
  ContractNameStub,
  FlowStub,
  FlowNodeStub,
  FlowEdgeStub,
  FlowObservableStub,
  ObservableIdStub,
} from '@dungeonmaster/shared/contracts';

import { VerifyQuestCheckStub } from '../../contracts/verify-quest-check/verify-quest-check.stub';
import { questVerifyFailureDetailsTransformer } from './quest-verify-failure-details-transformer';

type QuestContractProperty = ReturnType<typeof QuestContractPropertyStub>;
type QuestContractEntry = ReturnType<typeof QuestContractEntryStub>;
type Quest = ReturnType<typeof QuestStub>;
type VerifyQuestCheck = ReturnType<typeof VerifyQuestCheckStub>;

const brandCheckName = (name: string): VerifyQuestCheck['name'] =>
  VerifyQuestCheckStub({ name }).name;

const createPropertyWithRawType = (overrides: {
  name?: string;
  type: string;
}): QuestContractProperty => {
  const base = QuestContractPropertyStub({ name: overrides.name ?? 'stub' });
  return {
    ...base,
    type: overrides.type,
  } as QuestContractProperty;
};

const createEntryWithProperties = (
  properties: QuestContractProperty[],
  overrides?: { name?: string },
): QuestContractEntry => {
  const base = QuestContractEntryStub(overrides);
  return {
    ...base,
    properties,
  } as QuestContractEntry;
};

const createQuestWithContracts = (contracts: QuestContractEntry[]): Quest => {
  const base = QuestStub();
  return {
    ...base,
    contracts,
  } as Quest;
};

describe('questVerifyFailureDetailsTransformer', () => {
  describe('Observable Coverage', () => {
    it('VALID: {quest with uncovered observable} => returns uncovered observable ID', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });

      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                type: 'terminal',
                observables: [FlowObservableStub({ id: obsId })],
              }),
            ],
          }),
        ],
        steps: [
          DependencyStepStub({
            observablesSatisfied: [],
            filesToCreate: [],
            filesToModify: [],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Observable Coverage'),
      });

      expect(result).toBe(
        `Uncovered observable IDs (not in any step's observablesSatisfied): a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d`,
      );
    });

    it('VALID: {quest with multiple uncovered observables} => returns all uncovered IDs', () => {
      const obsId1 = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const obsId2 = ObservableIdStub({ value: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e' });

      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                type: 'terminal',
                observables: [
                  FlowObservableStub({ id: obsId1 }),
                  FlowObservableStub({ id: obsId2 }),
                ],
              }),
            ],
          }),
        ],
        steps: [
          DependencyStepStub({
            observablesSatisfied: [],
            filesToCreate: [],
            filesToModify: [],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Observable Coverage'),
      });

      expect(result).toBe(
        `Uncovered observable IDs (not in any step's observablesSatisfied): a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d, b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e`,
      );
    });
  });

  describe('Dependency Integrity', () => {
    it('VALID: {step with non-existent dependency} => returns step name and invalid dep', () => {
      const stepId = StepIdStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });
      const missingId = StepIdStub({ value: 'ffffffff-ffff-4fff-bfff-ffffffffffff' });

      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            id: stepId,
            name: 'fetch-user-step',
            dependsOn: [missingId],
            filesToCreate: [],
            filesToModify: [],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Dependency Integrity'),
      });

      expect(result).toBe(
        'step "fetch-user-step" dependsOn non-existent: [ffffffff-ffff-4fff-bfff-ffffffffffff]',
      );
    });
  });

  describe('Dependency Integrity - multiple', () => {
    it('VALID: {two steps with non-existent dependencies} => returns both step names and invalid deps', () => {
      const stepId1 = StepIdStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });
      const stepId2 = StepIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const missingId1 = StepIdStub({ value: 'ffffffff-ffff-4fff-bfff-ffffffffffff' });
      const missingId2 = StepIdStub({ value: 'eeeeeeee-eeee-4eee-beee-eeeeeeeeeeee' });

      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            id: stepId1,
            name: 'step-alpha',
            dependsOn: [missingId1],
            filesToCreate: [],
            filesToModify: [],
          }),
          DependencyStepStub({
            id: stepId2,
            name: 'step-beta',
            dependsOn: [missingId2],
            filesToCreate: [],
            filesToModify: [],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Dependency Integrity'),
      });

      expect(result).toBe(
        'step "step-alpha" dependsOn non-existent: [ffffffff-ffff-4fff-bfff-ffffffffffff]; step "step-beta" dependsOn non-existent: [eeeeeeee-eeee-4eee-beee-eeeeeeeeeeee]',
      );
    });
  });

  describe('No Circular Dependencies', () => {
    it('VALID: {any quest} => returns generic circular dep message', () => {
      const quest = QuestStub();

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('No Circular Dependencies'),
      });

      expect(result).toBe(
        'Circular dependency detected in step dependency graph — run topological sort to identify the cycle',
      );
    });
  });

  describe('No Orphan Steps', () => {
    it('VALID: {step with empty observablesSatisfied} => returns step name', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            name: 'orphan-step',
            observablesSatisfied: [],
            filesToCreate: [],
            filesToModify: [],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('No Orphan Steps'),
      });

      expect(result).toBe('Steps with empty observablesSatisfied: "orphan-step"');
    });
  });

  describe('No Orphan Steps - multiple', () => {
    it('VALID: {two steps with empty observablesSatisfied} => returns both step names', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            name: 'orphan-alpha',
            observablesSatisfied: [],
            filesToCreate: [],
            filesToModify: [],
          }),
          DependencyStepStub({
            name: 'orphan-beta',
            observablesSatisfied: [],
            filesToCreate: [],
            filesToModify: [],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('No Orphan Steps'),
      });

      expect(result).toBe('Steps with empty observablesSatisfied: "orphan-alpha", "orphan-beta"');
    });
  });

  describe('File Companion Completeness', () => {
    it('VALID: {broker without proxy} => returns missing companion path', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            filesToCreate: [
              'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts',
              'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.test.ts',
            ],
            filesToModify: [],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('File Companion Completeness'),
      });

      expect(result).toBe(
        'Missing companion files: "packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts" needs "packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.proxy.ts"',
      );
    });

    it('VALID: {contract without stub} => returns missing stub path', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            filesToCreate: [
              'packages/shared/src/contracts/user/user-contract.ts',
              'packages/shared/src/contracts/user/user-contract.test.ts',
            ],
            filesToModify: [],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('File Companion Completeness'),
      });

      expect(result).toBe(
        'Missing companion files: "packages/shared/src/contracts/user/user-contract.ts" needs "packages/shared/src/contracts/user/user.stub.ts"',
      );
    });
  });

  describe('File Companion Completeness - multiple', () => {
    it('VALID: {broker missing both proxy and test} => returns both missing companions', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            filesToCreate: [
              'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts',
            ],
            filesToModify: [],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('File Companion Completeness'),
      });

      expect(result).toBe(
        'Missing companion files: "packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts" needs "packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.test.ts"; "packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts" needs "packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.proxy.ts"',
      );
    });
  });

  describe('No Raw Primitives in Contracts', () => {
    it('VALID: {contract with string type property} => returns contract and property names', () => {
      const quest = createQuestWithContracts([
        createEntryWithProperties([createPropertyWithRawType({ name: 'email', type: 'string' })], {
          name: 'UserProfile',
        }),
      ]);

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('No Raw Primitives in Contracts'),
      });

      expect(result).toBe('contract "UserProfile" property "email" uses raw type "string"');
    });
  });

  describe('No Raw Primitives - multiple', () => {
    it('VALID: {two contracts with raw primitives} => returns both contract and property names', () => {
      const quest = createQuestWithContracts([
        createEntryWithProperties(
          [createPropertyWithRawType({ name: 'email', type: 'string' })],
          { name: 'UserProfile' },
        ),
        createEntryWithProperties(
          [createPropertyWithRawType({ name: 'age', type: 'number' })],
          { name: 'UserStats' },
        ),
      ]);

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('No Raw Primitives in Contracts'),
      });

      expect(result).toBe(
        'contract "UserProfile" property "email" uses raw type "string"; contract "UserStats" property "age" uses raw type "number"',
      );
    });
  });

  describe('Step Contract Declarations', () => {
    it('VALID: {step creating broker with empty outputContracts} => returns step name and folder type', () => {
      const quest = QuestStub({
        contracts: [QuestContractEntryStub()],
        steps: [
          DependencyStepStub({
            name: 'create-auth-broker',
            filesToCreate: ['packages/orchestrator/src/brokers/auth/login/auth-login-broker.ts'],
            filesToModify: [],
            outputContracts: [],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Step Contract Declarations'),
      });

      expect(result).toBe(
        'step "create-auth-broker" touches folders [brokers] which require contract declarations but has empty outputContracts',
      );
    });

    it('VALID: {multiple steps missing contracts} => returns all step names', () => {
      const quest = QuestStub({
        contracts: [QuestContractEntryStub()],
        steps: [
          DependencyStepStub({
            name: 'create-auth-broker',
            filesToCreate: ['packages/orchestrator/src/brokers/auth/login/auth-login-broker.ts'],
            filesToModify: [],
            outputContracts: [],
          }),
          DependencyStepStub({
            name: 'create-user-adapter',
            filesToCreate: ['packages/orchestrator/src/adapters/user/fetch/user-fetch-adapter.ts'],
            filesToModify: [],
            outputContracts: [],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Step Contract Declarations'),
      });

      expect(result).toBe(
        'step "create-auth-broker" touches folders [brokers] which require contract declarations but has empty outputContracts; step "create-user-adapter" touches folders [adapters] which require contract declarations but has empty outputContracts',
      );
    });
  });

  describe('Valid Contract References', () => {
    it('VALID: {step referencing non-existent contract} => returns step and contract names', () => {
      const existingName = ContractNameStub({ value: 'LoginCredentials' });
      const nonExistentName = ContractNameStub({ value: 'NonExistentContract' });

      const quest = QuestStub({
        contracts: [QuestContractEntryStub({ name: existingName })],
        steps: [
          DependencyStepStub({
            name: 'create-login-broker',
            inputContracts: [],
            outputContracts: [nonExistentName],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Valid Contract References'),
      });

      expect(result).toBe(
        'step "create-login-broker" outputContracts references non-existent: "NonExistentContract"',
      );
    });
  });

  describe('Valid Contract References - multiple', () => {
    it('VALID: {two steps referencing non-existent contracts} => returns both step and contract names', () => {
      const existingName = ContractNameStub({ value: 'LoginCredentials' });
      const missingName1 = ContractNameStub({ value: 'GhostContract' });
      const missingName2 = ContractNameStub({ value: 'PhantomContract' });

      const quest = QuestStub({
        contracts: [QuestContractEntryStub({ name: existingName })],
        steps: [
          DependencyStepStub({
            name: 'step-alpha',
            inputContracts: [missingName1],
            outputContracts: [],
          }),
          DependencyStepStub({
            name: 'step-beta',
            inputContracts: [],
            outputContracts: [missingName2],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Valid Contract References'),
      });

      expect(result).toBe(
        'step "step-alpha" inputContracts references non-existent: "GhostContract"; step "step-beta" outputContracts references non-existent: "PhantomContract"',
      );
    });
  });

  describe('Step Export Names', () => {
    it('VALID: {step with entry file but no exportName} => returns step name and file path', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            name: 'create-valid-guard',
            filesToCreate: ['packages/orchestrator/src/guards/is-valid/is-valid-guard.ts'],
            filesToModify: [],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Step Export Names'),
      });

      expect(result).toBe(
        'step "create-valid-guard" creates entry files [packages/orchestrator/src/guards/is-valid/is-valid-guard.ts] but has no exportName',
      );
    });
  });

  describe('Step Export Names - multiple', () => {
    it('VALID: {two steps with entry files but no exportName} => returns both step names', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            name: 'create-alpha-guard',
            filesToCreate: ['packages/orchestrator/src/guards/alpha/alpha-guard.ts'],
            filesToModify: [],
          }),
          DependencyStepStub({
            name: 'create-beta-transformer',
            filesToCreate: [
              'packages/orchestrator/src/transformers/beta/beta-transformer.ts',
            ],
            filesToModify: [],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Step Export Names'),
      });

      expect(result).toBe(
        'step "create-alpha-guard" creates entry files [packages/orchestrator/src/guards/alpha/alpha-guard.ts] but has no exportName; step "create-beta-transformer" creates entry files [packages/orchestrator/src/transformers/beta/beta-transformer.ts] but has no exportName',
      );
    });
  });

  describe('Valid Flow References', () => {
    it('VALID: {edge referencing non-existent node} => returns flow name and node ID', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            name: 'Auth Flow',
            nodes: [FlowNodeStub({ id: 'login-page' })],
            edges: [FlowEdgeStub({ from: 'login-page', to: 'non-existent' })],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Valid Flow References'),
      });

      expect(result).toBe('flow "Auth Flow" edge to "non-existent" references non-existent node');
    });
  });

  describe('Valid Flow References - multiple', () => {
    it('VALID: {edges with multiple non-existent nodes} => returns all invalid refs', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            name: 'Auth Flow',
            nodes: [FlowNodeStub({ id: 'login-page' })],
            edges: [
              FlowEdgeStub({ from: 'ghost-node', to: 'login-page' }),
              FlowEdgeStub({ from: 'login-page', to: 'phantom-node' }),
            ],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Valid Flow References'),
      });

      expect(result).toBe(
        'flow "Auth Flow" edge from "ghost-node" references non-existent node; flow "Auth Flow" edge to "phantom-node" references non-existent node',
      );
    });
  });

  describe('No Orphan Flow Nodes', () => {
    it('VALID: {node with no edges} => returns flow name and orphan node IDs', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            name: 'Auth Flow',
            nodes: [
              FlowNodeStub({ id: 'connected-a' }),
              FlowNodeStub({ id: 'connected-b' }),
              FlowNodeStub({ id: 'orphan-node', type: 'terminal' }),
            ],
            edges: [FlowEdgeStub({ from: 'connected-a', to: 'connected-b' })],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('No Orphan Flow Nodes'),
      });

      expect(result).toBe('flow "Auth Flow" has disconnected nodes: "orphan-node"');
    });
  });

  describe('No Orphan Flow Nodes - multiple', () => {
    it('VALID: {multiple orphan nodes} => returns all orphan node IDs', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            name: 'Auth Flow',
            nodes: [
              FlowNodeStub({ id: 'connected-a' }),
              FlowNodeStub({ id: 'connected-b' }),
              FlowNodeStub({ id: 'orphan-one' }),
              FlowNodeStub({ id: 'orphan-two' }),
            ],
            edges: [FlowEdgeStub({ from: 'connected-a', to: 'connected-b' })],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('No Orphan Flow Nodes'),
      });

      expect(result).toBe(
        'flow "Auth Flow" has disconnected nodes: "orphan-one", "orphan-two"',
      );
    });
  });

  describe('Node Observable Coverage', () => {
    it('VALID: {terminal node without observables} => returns flow name and node ID', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            name: 'Auth Flow',
            nodes: [
              FlowNodeStub({
                id: 'success',
                type: 'terminal',
                observables: [],
              }),
            ],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Node Observable Coverage'),
      });

      expect(result).toBe('flow "Auth Flow" terminal nodes without observables: "success"');
    });
  });

  describe('Node Observable Coverage - multiple', () => {
    it('VALID: {multiple terminal nodes without observables} => returns all node IDs', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            name: 'Auth Flow',
            nodes: [
              FlowNodeStub({ id: 'success', type: 'terminal', observables: [] }),
              FlowNodeStub({ id: 'error', type: 'terminal', observables: [] }),
            ],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Node Observable Coverage'),
      });

      expect(result).toBe(
        'flow "Auth Flow" terminal nodes without observables: "success", "error"',
      );
    });
  });

  describe('unknown check name', () => {
    it('EDGE: {unknown check name} => returns generic fallback message', () => {
      const quest = QuestStub();

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Unknown Check'),
      });

      expect(result).toBe('Check "Unknown Check" failed');
    });
  });
});
