import {
  QuestStub,
  ContextStub,
  ContextIdStub,
  ObservableStub,
  ObservableIdStub,
  DependencyStepStub,
  RequirementStub,
  RequirementIdStub,
  StepIdStub,
  QuestContractEntryStub,
  QuestContractPropertyStub,
  ContractNameStub,
  FlowStub,
} from '@dungeonmaster/shared/contracts';

import { questVerifyTransformer } from './quest-verify-transformer';

describe('questVerifyTransformer', () => {
  describe('all checks pass', () => {
    it('VALID: {well-formed quest with contracts and refs} => all checks pass', () => {
      const ctxId = ContextIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const reqId = RequirementIdStub({ value: 'a47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const stepId = StepIdStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });
      const contractName = ContractNameStub({ value: 'IsValid' });

      const quest = QuestStub({
        contexts: [ContextStub({ id: ctxId })],
        requirements: [RequirementStub({ id: reqId, status: 'approved' })],
        observables: [ObservableStub({ id: obsId, contextId: ctxId, requirementId: reqId })],
        flows: [FlowStub({ requirementIds: [reqId] })],
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
            filesToCreate: [
              'packages/orchestrator/src/guards/is-valid/is-valid-guard.ts',
              'packages/orchestrator/src/guards/is-valid/is-valid-guard.test.ts',
            ],
            filesToModify: [],
            outputContracts: [contractName],
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
          name: 'No Orphan Steps',
          passed: true,
          details: 'All 1 steps satisfy at least one observable',
        },
        {
          name: 'Valid Context References',
          passed: true,
          details: 'All observable contextId references point to existing contexts',
        },
        {
          name: 'Valid Requirement References',
          passed: true,
          details: 'All observable requirementId references point to existing requirements',
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
          details: 'All flow requirementIds reference existing requirements',
        },
        {
          name: 'Flow Coverage',
          passed: true,
          details: 'All approved requirements covered by flows',
        },
      ]);
    });
  });

  describe('observable coverage fails', () => {
    it('INVALID_COVERAGE: {observable not covered by any step} => observable coverage fails', () => {
      const ctxId = ContextIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });

      const quest = QuestStub({
        contexts: [ContextStub({ id: ctxId })],
        observables: [ObservableStub({ id: obsId, contextId: ctxId })],
        steps: [
          DependencyStepStub({
            observablesSatisfied: [],
            filesToCreate: [],
            filesToModify: [],
          }),
        ],
      });

      const [coverageCheck] = questVerifyTransformer({ quest });

      expect(coverageCheck).toStrictEqual({
        name: 'Observable Coverage',
        passed: false,
        details: "Some observables not covered by any step's observablesSatisfied",
      });
    });
  });

  describe('circular dependency detected', () => {
    it('INVALID_CYCLE: {steps with circular deps} => circular deps check fails', () => {
      const ctxId = ContextIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const stepId1 = StepIdStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });
      const stepId2 = StepIdStub({ value: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c' });

      const quest = QuestStub({
        contexts: [ContextStub({ id: ctxId })],
        observables: [ObservableStub({ id: obsId, contextId: ctxId })],
        steps: [
          DependencyStepStub({
            id: stepId1,
            observablesSatisfied: [obsId],
            dependsOn: [stepId2],
            filesToCreate: [],
            filesToModify: [],
          }),
          DependencyStepStub({
            id: stepId2,
            observablesSatisfied: [obsId],
            dependsOn: [stepId1],
            filesToCreate: [],
            filesToModify: [],
          }),
        ],
      });

      const [, , circularCheck] = questVerifyTransformer({ quest });

      expect(circularCheck).toStrictEqual({
        name: 'No Circular Dependencies',
        passed: false,
        details: 'Circular dependency detected in step dependency graph',
      });
    });
  });

  describe('empty quest', () => {
    it('VALID: {quest with empty arrays} => all checks pass', () => {
      const quest = QuestStub({
        contexts: [],
        observables: [],
        steps: [],
        requirements: [],
      });

      const result = questVerifyTransformer({ quest });

      expect(result.every((check) => check.passed)).toBe(true);
    });
  });

  describe('missing file companions', () => {
    it('INVALID_COMPANION: {broker without proxy} => file companions fails', () => {
      const ctxId = ContextIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });

      const quest = QuestStub({
        contexts: [ContextStub({ id: ctxId })],
        observables: [ObservableStub({ id: obsId, contextId: ctxId })],
        steps: [
          DependencyStepStub({
            observablesSatisfied: [obsId],
            filesToCreate: [
              'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.ts',
              'packages/orchestrator/src/brokers/quest/verify/quest-verify-broker.test.ts',
            ],
            filesToModify: [],
          }),
        ],
      });

      const [, , , , , , companionCheck] = questVerifyTransformer({ quest });

      expect(companionCheck).toStrictEqual({
        name: 'File Companion Completeness',
        passed: false,
        details: 'Some implementation files are missing required companion files',
      });
    });
  });

  describe('raw primitives in contracts', () => {
    it('INVALID_PRIMITIVES: {contract with string type property} => raw primitives check fails', () => {
      const quest = QuestStub({
        contracts: [
          QuestContractEntryStub({
            properties: [QuestContractPropertyStub({ name: 'name', type: 'string' })],
          }),
        ],
      });

      const [, , , , , , , primitivesCheck] = questVerifyTransformer({ quest });

      expect(primitivesCheck).toStrictEqual({
        name: 'No Raw Primitives in Contracts',
        passed: false,
        details:
          'Some contract properties use raw primitive types (string, number, any, object, unknown)',
      });
    });
  });

  describe('steps missing contract declarations', () => {
    it('INVALID_CONTRACTS: {step creating broker file but outputContracts empty} => step contract declarations fails', () => {
      const quest = QuestStub({
        contracts: [QuestContractEntryStub()],
        steps: [
          DependencyStepStub({
            filesToCreate: ['packages/orchestrator/src/brokers/user/fetch/user-fetch-broker.ts'],
            filesToModify: [],
            outputContracts: [],
          }),
        ],
      });

      const [, , , , , , , , contractRefsCheck] = questVerifyTransformer({ quest });

      expect(contractRefsCheck).toStrictEqual({
        name: 'Step Contract Declarations',
        passed: false,
        details: 'Some steps are missing required contract declarations in outputContracts',
      });
    });
  });

  describe('steps referencing non-existent contracts', () => {
    it('INVALID_CONTRACTS: {step with outputContracts referencing non-existent contract} => valid contract references fails', () => {
      const existingName = ContractNameStub({ value: 'LoginCredentials' });
      const nonExistentName = ContractNameStub({ value: 'NonExistentContract' });

      const quest = QuestStub({
        contracts: [QuestContractEntryStub({ name: existingName })],
        steps: [
          DependencyStepStub({
            inputContracts: [],
            outputContracts: [nonExistentName],
          }),
        ],
      });

      const [, , , , , , , , , validContractRefsCheck] = questVerifyTransformer({ quest });

      expect(validContractRefsCheck).toStrictEqual({
        name: 'Valid Contract References',
        passed: false,
        details:
          'Some steps reference non-existent contract names in inputContracts or outputContracts',
      });
    });
  });

  describe('steps missing export names', () => {
    it('INVALID_EXPORT: {step with entry file but no exportName} => step export names fails', () => {
      const quest = QuestStub({
        steps: [
          DependencyStepStub({
            filesToCreate: ['packages/orchestrator/src/guards/is-valid/is-valid-guard.ts'],
            filesToModify: [],
          }),
        ],
      });

      const [, , , , , , , , , , exportNameCheck] = questVerifyTransformer({ quest });

      expect(exportNameCheck).toStrictEqual({
        name: 'Step Export Names',
        passed: false,
        details: 'Some steps with entry files are missing required exportName',
      });
    });
  });

  describe('invalid flow references', () => {
    it('INVALID_FLOW_REF: {flow references non-existent requirement} => valid flow references fails', () => {
      const reqId = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const invalidReqId = RequirementIdStub({ value: 'aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee' });

      const quest = QuestStub({
        requirements: [RequirementStub({ id: reqId })],
        flows: [FlowStub({ requirementIds: [invalidReqId] })],
      });

      const [, , , , , , , , , , , flowRefsCheck] = questVerifyTransformer({ quest });

      expect(flowRefsCheck).toStrictEqual({
        name: 'Valid Flow References',
        passed: false,
        details: 'Some flows reference non-existent requirement IDs',
      });
    });
  });

  describe('flow coverage soft warning', () => {
    it('SOFT_WARNING: {approved requirement not covered by any flow} => flow coverage passes with warning', () => {
      const reqId = RequirementIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      const quest = QuestStub({
        requirements: [RequirementStub({ id: reqId, status: 'approved' })],
        flows: [FlowStub({ requirementIds: [] })],
      });

      const [, , , , , , , , , , , , flowCoverageCheck] = questVerifyTransformer({ quest });

      expect(flowCoverageCheck).toStrictEqual({
        name: 'Flow Coverage',
        passed: true,
        details:
          'WARNING: Not all approved requirements are covered by flows (optional for simple quests)',
      });
    });
  });
});
