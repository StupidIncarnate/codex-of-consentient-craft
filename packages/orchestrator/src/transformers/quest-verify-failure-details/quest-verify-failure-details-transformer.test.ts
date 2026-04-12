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
  StepFileReferenceStub,
  StepFocusActionStub,
} from '@dungeonmaster/shared/contracts';

import { VerifyQuestCheckStub } from '../../contracts/verify-quest-check/verify-quest-check.stub';
import { questVerifyFailureDetailsTransformer } from './quest-verify-failure-details-transformer';

type QuestContractProperty = ReturnType<typeof QuestContractPropertyStub>;
type QuestContractEntry = ReturnType<typeof QuestContractEntryStub>;
type Quest = ReturnType<typeof QuestStub>;
type DependencyStep = ReturnType<typeof DependencyStepStub>;
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

const createFocusActionStep = (overrides: { id: string; name: string }): DependencyStep => {
  const base = DependencyStepStub({
    id: overrides.id,
    name: overrides.name,
    accompanyingFiles: [],
  });
  Reflect.deleteProperty(base, 'focusFile');
  Object.assign(base, { focusAction: StepFocusActionStub() });
  return base;
};

const createNoFocusStep = (overrides: { id: string; name: string }): DependencyStep => {
  const base = DependencyStepStub({
    id: overrides.id,
    name: overrides.name,
    accompanyingFiles: [],
  });
  Reflect.deleteProperty(base, 'focusFile');
  return base;
};

const createBothFocusStep = (overrides: {
  id: string;
  name: string;
  path: string;
}): DependencyStep => {
  const base = DependencyStepStub({
    id: overrides.id,
    name: overrides.name,
    focusFile: StepFileReferenceStub({ path: overrides.path }),
    accompanyingFiles: [],
  });
  Object.assign(base, { focusAction: StepFocusActionStub() });
  return base;
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
          }),
          DependencyStepStub({
            id: stepId2,
            name: 'step-beta',
            dependsOn: [missingId2],
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/other/other-guard.ts',
            }),
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

  describe('File Companion Completeness', () => {
    it('VALID: {broker without proxy} => returns missing companion path', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts',
            }),
            accompanyingFiles: [
              StepFileReferenceStub({
                path: 'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.test.ts',
              }),
            ],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('File Companion Completeness'),
      });

      expect(result).toBe(
        'Companion file issues: step "Test Step" focusFile "packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts" needs "packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.proxy.ts"',
      );
    });

    it('VALID: {contract without stub} => returns missing stub path', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            focusFile: StepFileReferenceStub({
              path: 'packages/shared/src/contracts/user/user-contract.ts',
            }),
            accompanyingFiles: [
              StepFileReferenceStub({
                path: 'packages/shared/src/contracts/user/user-contract.test.ts',
              }),
            ],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('File Companion Completeness'),
      });

      expect(result).toBe(
        'Companion file issues: step "Test Step" focusFile "packages/shared/src/contracts/user/user-contract.ts" needs "packages/shared/src/contracts/user/user.stub.ts"',
      );
    });
  });

  describe('File Companion Completeness - multiple', () => {
    it('VALID: {broker missing both proxy and test} => returns both missing companions', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts',
            }),
            accompanyingFiles: [],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('File Companion Completeness'),
      });

      expect(result).toBe(
        'Companion file issues: step "Test Step" focusFile "packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts" needs "packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.test.ts"; step "Test Step" focusFile "packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts" needs "packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.proxy.ts"',
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
        createEntryWithProperties([createPropertyWithRawType({ name: 'email', type: 'string' })], {
          name: 'UserProfile',
        }),
        createEntryWithProperties([createPropertyWithRawType({ name: 'age', type: 'number' })], {
          name: 'UserStats',
        }),
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
    it('VALID: {step creating broker with Void outputContracts} => returns step name and folder type', () => {
      const quest = QuestStub({
        contracts: [QuestContractEntryStub()],
        steps: [
          DependencyStepStub({
            name: 'create-auth-broker',
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/auth/login/auth-login-broker.ts',
            }),
            outputContracts: [ContractNameStub({ value: 'Void' })],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Step Contract Declarations'),
      });

      expect(result).toBe(
        'step "create-auth-broker" in folder [brokers] has outputContracts ["Void"] but folder requires real contract declarations',
      );
    });

    it('VALID: {multiple steps missing contracts} => returns all step names', () => {
      const quest = QuestStub({
        contracts: [QuestContractEntryStub()],
        steps: [
          DependencyStepStub({
            name: 'create-auth-broker',
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/auth/login/auth-login-broker.ts',
            }),
            outputContracts: [ContractNameStub({ value: 'Void' })],
          }),
          DependencyStepStub({
            name: 'create-user-adapter',
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/adapters/user/fetch/user-fetch-adapter.ts',
            }),
            outputContracts: [ContractNameStub({ value: 'Void' })],
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Step Contract Declarations'),
      });

      expect(result).toBe(
        'step "create-auth-broker" in folder [brokers] has outputContracts ["Void"] but folder requires real contract declarations; step "create-user-adapter" in folder [adapters] has outputContracts ["Void"] but folder requires real contract declarations',
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
            inputContracts: [ContractNameStub({ value: 'Void' })],
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
            outputContracts: [ContractNameStub({ value: 'Void' })],
          }),
          DependencyStepStub({
            name: 'step-beta',
            inputContracts: [ContractNameStub({ value: 'Void' })],
            outputContracts: [missingName2],
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/other/other-guard.ts',
            }),
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
    it('VALID: {step with entry focusFile but no exportName} => returns step name and file path', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            name: 'create-valid-guard',
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
            }),
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Step Export Names'),
      });

      expect(result).toBe(
        'step "create-valid-guard" creates entry file "packages/orchestrator/src/guards/is-valid/is-valid-guard.ts" but has no exportName',
      );
    });
  });

  describe('Step Export Names - multiple', () => {
    it('VALID: {two steps with entry focusFiles but no exportName} => returns both step names', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            name: 'create-alpha-guard',
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/alpha/alpha-guard.ts',
            }),
          }),
          DependencyStepStub({
            name: 'create-beta-transformer',
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/transformers/beta/beta-transformer.ts',
            }),
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Step Export Names'),
      });

      expect(result).toBe(
        'step "create-alpha-guard" creates entry file "packages/orchestrator/src/guards/alpha/alpha-guard.ts" but has no exportName; step "create-beta-transformer" creates entry file "packages/orchestrator/src/transformers/beta/beta-transformer.ts" but has no exportName',
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

      expect(result).toBe('flow "Auth Flow" has disconnected nodes: "orphan-one", "orphan-two"');
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

  describe('No Duplicate Focus Files', () => {
    it('VALID: {two steps sharing same focusFile path} => returns step names and path', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
            name: 'Step A',
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
            }),
          }),
          DependencyStepStub({
            id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
            name: 'Step B',
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
            }),
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('No Duplicate Focus Files'),
      });

      expect(result).toBe(
        'steps "Step A" and "Step B" share focusFile "packages/orchestrator/src/guards/is-valid/is-valid-guard.ts"',
      );
    });
  });

  describe('Valid Focus Files', () => {
    it('VALID: {step with unknown folder type in focusFile} => returns step name and path', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            name: 'create-unknown',
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/unknown-folder/some-file.ts',
            }),
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Valid Focus Files'),
      });

      expect(result).toBe(
        'step "create-unknown" focusFile "packages/orchestrator/src/unknown-folder/some-file.ts" does not match any known folder type',
      );
    });
  });

  describe('Step Focus Target check', () => {
    it('VALID: {quest with step missing both focusFile and focusAction} => returns neither-message', () => {
      const quest = QuestStub({
        steps: [createNoFocusStep({ id: 'f0a1b2c3-d4e5-4a6b-8c7d-0e9f8a7b6c5d', name: 'orphan-step' })],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Step Focus Target'),
      });

      expect(result).toBe('step "orphan-step" has neither focusFile nor focusAction');
    });

    it('VALID: {quest with step having both focusFile and focusAction} => returns both-message', () => {
      const quest = QuestStub({
        steps: [
          createBothFocusStep({
            id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
            name: 'dual-step',
            path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Step Focus Target'),
      });

      expect(result).toBe(
        'step "dual-step" has both focusFile and focusAction (must be exactly one)',
      );
    });

    it('EDGE: {multiple steps with mixed issues} => returns both issues joined by semicolon', () => {
      const quest = QuestStub({
        steps: [
          createNoFocusStep({ id: 'f0a1b2c3-d4e5-4a6b-8c7d-0e9f8a7b6c5d', name: 'orphan-step' }),
          createBothFocusStep({
            id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
            name: 'dual-step',
            path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Step Focus Target'),
      });

      expect(result).toBe(
        'step "orphan-step" has neither focusFile nor focusAction; step "dual-step" has both focusFile and focusAction (must be exactly one)',
      );
    });
  });

  describe('File Companion Completeness - filters focusAction steps', () => {
    it('VALID: {file-anchored step with missing proxy alongside focusAction step} => returns only file-anchored issue', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
            name: 'create-broker-step',
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts',
            }),
            accompanyingFiles: [
              StepFileReferenceStub({
                path: 'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.test.ts',
              }),
            ],
          }),
          createFocusActionStep({
            id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
            name: 'run-ward-step',
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('File Companion Completeness'),
      });

      expect(result).toBe(
        'Companion file issues: step "create-broker-step" focusFile "packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts" needs "packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.proxy.ts"',
      );
    });
  });

  describe('Step Contract Declarations - filters focusAction steps', () => {
    it('VALID: {file-anchored step with Void outputContracts alongside focusAction step} => returns only file-anchored issue', () => {
      const quest = QuestStub({
        contracts: [QuestContractEntryStub()],
        steps: [
          DependencyStepStub({
            id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
            name: 'create-auth-broker',
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/auth/login/auth-login-broker.ts',
            }),
            outputContracts: [ContractNameStub({ value: 'Void' })],
          }),
          createFocusActionStep({
            id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
            name: 'run-ward-step',
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Step Contract Declarations'),
      });

      expect(result).toBe(
        'step "create-auth-broker" in folder [brokers] has outputContracts ["Void"] but folder requires real contract declarations',
      );
    });
  });

  describe('Step Export Names - filters focusAction steps', () => {
    it('VALID: {file-anchored entry-file step without exportName alongside focusAction step} => returns only file-anchored issue', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
            name: 'create-valid-guard',
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
            }),
          }),
          createFocusActionStep({
            id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
            name: 'run-ward-step',
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Step Export Names'),
      });

      expect(result).toBe(
        'step "create-valid-guard" creates entry file "packages/orchestrator/src/guards/is-valid/is-valid-guard.ts" but has no exportName',
      );
    });
  });

  describe('No Duplicate Focus Files - filters focusAction steps', () => {
    it('VALID: {two file-anchored steps sharing focusFile alongside focusAction step} => returns only file-anchored duplicate', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
            name: 'Step A',
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
            }),
          }),
          DependencyStepStub({
            id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
            name: 'Step B',
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
            }),
          }),
          createFocusActionStep({
            id: 'c3d4e5f6-a7b8-4c5d-8e9f-0a1b2c3d4e5f',
            name: 'run-ward-step',
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('No Duplicate Focus Files'),
      });

      expect(result).toBe(
        'steps "Step A" and "Step B" share focusFile "packages/orchestrator/src/guards/is-valid/is-valid-guard.ts"',
      );
    });
  });

  describe('Valid Focus Files - filters focusAction steps', () => {
    it('VALID: {file-anchored step with unknown folder type alongside focusAction step} => returns only file-anchored issue', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
            name: 'create-unknown',
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/unknown-folder/some-file.ts',
            }),
          }),
          createFocusActionStep({
            id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
            name: 'run-ward-step',
          }),
        ],
      });

      const result = questVerifyFailureDetailsTransformer({
        quest,
        checkName: brandCheckName('Valid Focus Files'),
      });

      expect(result).toBe(
        'step "create-unknown" focusFile "packages/orchestrator/src/unknown-folder/some-file.ts" does not match any known folder type',
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
