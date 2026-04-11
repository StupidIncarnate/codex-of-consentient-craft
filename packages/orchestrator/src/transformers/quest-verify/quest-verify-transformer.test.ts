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
  StepAssertionStub,
} from '@dungeonmaster/shared/contracts';

import { questVerifyTransformer } from './quest-verify-transformer';

type QuestContractProperty = ReturnType<typeof QuestContractPropertyStub>;

/**
 * Creates a QuestContractProperty with a raw primitive type that bypasses Zod validation.
 * The Zod contract now rejects "string" and "number" at parse time, but the guard still
 * needs to handle data from external sources that bypasses Zod parsing.
 */
type QuestContractEntry = ReturnType<typeof QuestContractEntryStub>;
type Quest = ReturnType<typeof QuestStub>;

/**
 * Creates a QuestContractProperty with a raw primitive type that bypasses Zod validation.
 * The Zod contract now rejects "string" and "number" at parse time, but the guard still
 * needs to handle data from external sources that bypasses Zod parsing.
 */
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

/**
 * Creates a QuestContractEntry with pre-built properties, bypassing Zod validation.
 */
const createEntryWithProperties = (properties: QuestContractProperty[]): QuestContractEntry => {
  const base = QuestContractEntryStub();

  return {
    ...base,
    properties,
  } as QuestContractEntry;
};

/**
 * Creates a Quest with pre-built contracts, bypassing Zod validation on the quest stub.
 */
const createQuestWithContracts = (contracts: QuestContractEntry[]): Quest => {
  const base = QuestStub();

  return {
    ...base,
    contracts,
  } as Quest;
};

describe('questVerifyTransformer', () => {
  describe('all checks pass', () => {
    it('VALID: {well-formed quest with flows, nodes, observables, contracts} => all 13 checks pass', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const stepId = StepIdStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });
      const contractName = ContractNameStub({ value: 'IsValid' });

      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({
                id: 'login-page',
                type: 'terminal',
                observables: [FlowObservableStub({ id: obsId })],
              }),
              FlowNodeStub({
                id: 'dashboard',
                type: 'state',
                observables: [],
              }),
            ],
            edges: [FlowEdgeStub({ from: 'login-page', to: 'dashboard' })],
          }),
        ],
        contracts: [
          QuestContractEntryStub({
            name: contractName,
            properties: [QuestContractPropertyStub({ name: 'email', type: 'EmailAddress' })],
          }),
        ],
        steps: [
          DependencyStepStub({
            id: stepId,
            observablesSatisfied: [obsId],
            dependsOn: [],
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
            }),
            accompanyingFiles: [
              StepFileReferenceStub({
                path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.test.ts',
              }),
            ],
            outputContracts: [contractName],
            inputContracts: [ContractNameStub({ value: 'Void' })],
            assertions: [StepAssertionStub({ prefix: 'VALID' })],
            exportName: 'isValidGuard',
          }),
        ],
      });

      const result = questVerifyTransformer({ quest });

      expect(result).toStrictEqual([
        {
          name: 'Observable Coverage',
          passed: true,
          details: 'All 1 observables covered by steps',
        },
        {
          name: 'Dependency Integrity',
          passed: true,
          details: 'All step dependsOn references point to existing steps',
        },
        {
          name: 'No Circular Dependencies',
          passed: true,
          details: 'Step dependency graph is a valid DAG',
        },
        {
          name: 'File Companion Completeness',
          passed: true,
          details: 'All implementation files have required companion files (test, proxy, stub)',
        },
        {
          name: 'No Raw Primitives in Contracts',
          passed: true,
          details: 'All contract properties use branded or non-primitive types',
        },
        {
          name: 'Step Contract Declarations',
          passed: true,
          details: 'All steps in contract-requiring folders have outputContracts declared',
        },
        {
          name: 'Valid Contract References',
          passed: true,
          details: 'All step inputContracts and outputContracts reference existing contracts',
        },
        {
          name: 'Step Export Names',
          passed: true,
          details: 'All steps creating entry files have exportName set',
        },
        {
          name: 'Valid Flow References',
          passed: true,
          details: 'All flow edge references point to existing nodes',
        },
        {
          name: 'No Orphan Flow Nodes',
          passed: true,
          details: 'All flow nodes are connected to at least one edge',
        },
        {
          name: 'Node Observable Coverage',
          passed: true,
          details: 'All terminal nodes have at least one observable',
        },
        {
          name: 'No Duplicate Focus Files',
          passed: true,
          details: 'All steps have unique focusFile paths',
        },
        {
          name: 'Valid Focus Files',
          passed: true,
          details: 'All steps have focusFile paths matching known folder types',
        },
        {
          name: 'Step Focus Target',
          passed: true,
          details: 'All steps have exactly one of focusFile or focusAction',
        },
      ]);
    });
  });

  describe('observable coverage fails', () => {
    it('INVALID: {observable not covered by any step} => observable coverage fails', () => {
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
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/statics/config/config-statics.ts',
            }),
            accompanyingFiles: [],
          }),
        ],
      });

      const [coverageCheck] = questVerifyTransformer({ quest });

      expect(coverageCheck).toStrictEqual({
        name: 'Observable Coverage',
        passed: false,
        details: `Uncovered observable IDs (not in any step's observablesSatisfied): a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d`,
      });
    });
  });

  describe('circular dependency detected', () => {
    it('INVALID: {steps with circular deps} => circular deps check fails', () => {
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const stepId1 = StepIdStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });
      const stepId2 = StepIdStub({ value: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c' });

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
            id: stepId1,
            observablesSatisfied: [obsId],
            dependsOn: [stepId2],
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/statics/config/config-statics.ts',
            }),
            accompanyingFiles: [],
          }),
          DependencyStepStub({
            id: stepId2,
            observablesSatisfied: [obsId],
            dependsOn: [stepId1],
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/statics/other/other-statics.ts',
            }),
            accompanyingFiles: [],
          }),
        ],
      });

      const [, , circularCheck] = questVerifyTransformer({ quest });

      expect(circularCheck).toStrictEqual({
        name: 'No Circular Dependencies',
        passed: false,
        details:
          'Circular dependency detected in step dependency graph — run topological sort to identify the cycle',
      });
    });
  });

  describe('empty quest', () => {
    it('VALID: {quest with empty arrays} => all checks pass', () => {
      const quest = QuestStub({
        flows: [],
        steps: [],
      });

      const result = questVerifyTransformer({ quest });

      expect(result.every((check) => check.passed)).toBe(true);
    });
  });

  describe('missing file companions', () => {
    it('INVALID: {broker without proxy} => file companions fails', () => {
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
            observablesSatisfied: [obsId],
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

      const [, , , companionCheck] = questVerifyTransformer({ quest });

      expect(companionCheck).toStrictEqual({
        name: 'File Companion Completeness',
        passed: false,
        details:
          'Companion file issues: step "Test Step" focusFile "packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts" needs "packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.proxy.ts"',
      });
    });
  });

  describe('raw primitives in contracts', () => {
    it('INVALID: {contract with string type property} => raw primitives check fails', () => {
      const quest = createQuestWithContracts([
        createEntryWithProperties([createPropertyWithRawType({ name: 'name', type: 'string' })]),
      ]);

      const [, , , , primitivesCheck] = questVerifyTransformer({ quest });

      expect(primitivesCheck).toStrictEqual({
        name: 'No Raw Primitives in Contracts',
        passed: false,
        details: 'contract "LoginCredentials" property "name" uses raw type "string"',
      });
    });
  });

  describe('steps missing contract declarations', () => {
    it('INVALID: {step creating broker file but outputContracts is Void} => step contract declarations fails', () => {
      const quest = QuestStub({
        contracts: [QuestContractEntryStub()],
        steps: [
          DependencyStepStub({
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/brokers/user/fetch/user-fetch-broker.ts',
            }),
            outputContracts: [ContractNameStub({ value: 'Void' })],
          }),
        ],
      });

      const [, , , , , contractRefsCheck] = questVerifyTransformer({ quest });

      expect(contractRefsCheck).toStrictEqual({
        name: 'Step Contract Declarations',
        passed: false,
        details:
          'step "Test Step" in folder [brokers] has outputContracts ["Void"] but folder requires real contract declarations',
      });
    });
  });

  describe('steps referencing non-existent contracts', () => {
    it('INVALID: {step with outputContracts referencing non-existent contract} => valid contract references fails', () => {
      const existingName = ContractNameStub({ value: 'LoginCredentials' });
      const nonExistentName = ContractNameStub({ value: 'NonExistentContract' });

      const quest = QuestStub({
        contracts: [QuestContractEntryStub({ name: existingName })],
        steps: [
          DependencyStepStub({
            inputContracts: [ContractNameStub({ value: 'Void' })],
            outputContracts: [nonExistentName],
          }),
        ],
      });

      const [, , , , , , validContractRefsCheck] = questVerifyTransformer({ quest });

      expect(validContractRefsCheck).toStrictEqual({
        name: 'Valid Contract References',
        passed: false,
        details: 'step "Test Step" outputContracts references non-existent: "NonExistentContract"',
      });
    });
  });

  describe('steps missing export names', () => {
    it('INVALID: {step with entry focusFile but no exportName} => step export names fails', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
            }),
            accompanyingFiles: [
              StepFileReferenceStub({
                path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.test.ts',
              }),
            ],
          }),
        ],
      });

      const [, , , , , , , exportNameCheck] = questVerifyTransformer({ quest });

      expect(exportNameCheck).toStrictEqual({
        name: 'Step Export Names',
        passed: false,
        details:
          'step "Test Step" creates entry file "packages/orchestrator/src/guards/is-valid/is-valid-guard.ts" but has no exportName',
      });
    });
  });

  describe('invalid flow references', () => {
    it('INVALID: {edge references non-existent node} => valid flow references fails', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [FlowNodeStub({ id: 'login-page' })],
            edges: [FlowEdgeStub({ from: 'login-page', to: 'non-existent' })],
          }),
        ],
      });

      const [, , , , , , , , flowRefsCheck] = questVerifyTransformer({ quest });

      expect(flowRefsCheck).toStrictEqual({
        name: 'Valid Flow References',
        passed: false,
        details: 'flow "Login Flow" edge to "non-existent" references non-existent node',
      });
    });
  });

  describe('orphan flow nodes', () => {
    it('INVALID: {node with no edges} => orphan flow nodes check fails', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
            nodes: [
              FlowNodeStub({ id: 'connected-a' }),
              FlowNodeStub({ id: 'connected-b' }),
              FlowNodeStub({ id: 'orphan-node', type: 'terminal' }),
            ],
            edges: [FlowEdgeStub({ from: 'connected-a', to: 'connected-b' })],
          }),
        ],
      });

      const [, , , , , , , , , orphanCheck] = questVerifyTransformer({ quest });

      expect(orphanCheck).toStrictEqual({
        name: 'No Orphan Flow Nodes',
        passed: false,
        details: 'flow "Login Flow" has disconnected nodes: "orphan-node"',
      });
    });
  });

  describe('node observable coverage fails', () => {
    it('INVALID: {terminal node without observables} => node observable coverage fails', () => {
      const quest = QuestStub({
        flows: [
          FlowStub({
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

      const [, , , , , , , , , , nodeCoverageCheck] = questVerifyTransformer({ quest });

      expect(nodeCoverageCheck).toStrictEqual({
        name: 'Node Observable Coverage',
        passed: false,
        details: 'flow "Login Flow" terminal nodes without observables: "success"',
      });
    });
  });

  describe('duplicate focus files', () => {
    it('INVALID: {two steps with same focusFile path} => duplicate focus files fails', () => {
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
            id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
            name: 'Step A',
            observablesSatisfied: [obsId],
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
            }),
            accompanyingFiles: [
              StepFileReferenceStub({
                path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.test.ts',
              }),
            ],
          }),
          DependencyStepStub({
            id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
            name: 'Step B',
            observablesSatisfied: [obsId],
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
            }),
            accompanyingFiles: [
              StepFileReferenceStub({
                path: 'packages/orchestrator/src/guards/is-valid/is-valid-guard.test.ts',
              }),
            ],
          }),
        ],
      });

      const [, , , , , , , , , , , duplicateCheck] = questVerifyTransformer({ quest });

      expect(duplicateCheck).toStrictEqual({
        name: 'No Duplicate Focus Files',
        passed: false,
        details:
          'steps "Step A" and "Step B" share focusFile "packages/orchestrator/src/guards/is-valid/is-valid-guard.ts"',
      });
    });
  });

  describe('invalid focus file paths', () => {
    it('INVALID: {step with focusFile path not matching known folder type} => valid focus files fails', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            focusFile: StepFileReferenceStub({
              path: 'packages/orchestrator/src/unknown-folder/some-file.ts',
            }),
            accompanyingFiles: [],
          }),
        ],
      });

      const [, , , , , , , , , , , , focusFileCheck] = questVerifyTransformer({ quest });

      expect(focusFileCheck).toStrictEqual({
        name: 'Valid Focus Files',
        passed: false,
        details:
          'step "Test Step" focusFile "packages/orchestrator/src/unknown-folder/some-file.ts" does not match any known folder type',
      });
    });
  });
});
