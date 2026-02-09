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
} from '@dungeonmaster/shared/contracts';

import { questVerifyTransformer } from './quest-verify-transformer';

describe('questVerifyTransformer', () => {
  describe('all checks pass', () => {
    it('VALID: {well-formed quest} => all checks pass', () => {
      const ctxId = ContextIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const reqId = RequirementIdStub({ value: 'a47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const obsId = ObservableIdStub({ value: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d' });
      const stepId = StepIdStub({ value: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b' });

      const quest = QuestStub({
        contexts: [ContextStub({ id: ctxId })],
        requirements: [RequirementStub({ id: reqId })],
        observables: [ObservableStub({ id: obsId, contextId: ctxId, requirementId: reqId })],
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
});
