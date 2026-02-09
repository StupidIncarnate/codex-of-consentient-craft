import { DependencyStepStub, StepIdStub } from '@dungeonmaster/shared/contracts';

import { isStepReadyGuard } from './is-step-ready-guard';

describe('isStepReadyGuard', () => {
  describe('valid ready steps', () => {
    it('VALID: {pending step with no dependencies} => returns true', () => {
      const step = DependencyStepStub({ status: 'pending', dependsOn: [] });
      const allSteps = [step];

      const result = isStepReadyGuard({ step, allSteps });

      expect(result).toBe(true);
    });

    it('VALID: {pending step with completed dependency} => returns true', () => {
      const depStepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const depStep = DependencyStepStub({
        id: depStepId,
        status: 'complete',
        dependsOn: [],
      });
      const step = DependencyStepStub({
        id: StepIdStub({ value: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' }),
        status: 'pending',
        dependsOn: [depStepId],
      });
      const allSteps = [depStep, step];

      const result = isStepReadyGuard({ step, allSteps });

      expect(result).toBe(true);
    });

    it('VALID: {pending step with all dependencies complete} => returns true', () => {
      const depStepId1 = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const depStepId2 = StepIdStub({ value: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' });
      const depStep1 = DependencyStepStub({
        id: depStepId1,
        status: 'complete',
        dependsOn: [],
      });
      const depStep2 = DependencyStepStub({
        id: depStepId2,
        status: 'complete',
        dependsOn: [],
      });
      const step = DependencyStepStub({
        id: StepIdStub({ value: 'c3d4e5f6-a7b8-6c9d-0e1f-2a3b4c5d6e7f' }),
        status: 'pending',
        dependsOn: [depStepId1, depStepId2],
      });
      const allSteps = [depStep1, depStep2, step];

      const result = isStepReadyGuard({ step, allSteps });

      expect(result).toBe(true);
    });
  });

  describe('invalid not ready steps', () => {
    it('INVALID_STATUS: {step already in_progress} => returns false', () => {
      const step = DependencyStepStub({ status: 'in_progress', dependsOn: [] });
      const allSteps = [step];

      const result = isStepReadyGuard({ step, allSteps });

      expect(result).toBe(false);
    });

    it('INVALID_STATUS: {step already complete} => returns false', () => {
      const step = DependencyStepStub({ status: 'complete', dependsOn: [] });
      const allSteps = [step];

      const result = isStepReadyGuard({ step, allSteps });

      expect(result).toBe(false);
    });

    it('INVALID_STATUS: {step blocked} => returns false', () => {
      const step = DependencyStepStub({ status: 'blocked', dependsOn: [] });
      const allSteps = [step];

      const result = isStepReadyGuard({ step, allSteps });

      expect(result).toBe(false);
    });

    it('INVALID_STATUS: {step failed} => returns false', () => {
      const step = DependencyStepStub({ status: 'failed', dependsOn: [] });
      const allSteps = [step];

      const result = isStepReadyGuard({ step, allSteps });

      expect(result).toBe(false);
    });

    it('INVALID_STATUS: {step partially_complete} => returns false', () => {
      const step = DependencyStepStub({ status: 'partially_complete', dependsOn: [] });
      const allSteps = [step];

      const result = isStepReadyGuard({ step, allSteps });

      expect(result).toBe(false);
    });

    it('INVALID_DEPENDENCY: {pending step with pending dependency} => returns false', () => {
      const depStepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const depStep = DependencyStepStub({
        id: depStepId,
        status: 'pending',
        dependsOn: [],
      });
      const step = DependencyStepStub({
        id: StepIdStub({ value: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' }),
        status: 'pending',
        dependsOn: [depStepId],
      });
      const allSteps = [depStep, step];

      const result = isStepReadyGuard({ step, allSteps });

      expect(result).toBe(false);
    });

    it('INVALID_DEPENDENCY: {pending step with in_progress dependency} => returns false', () => {
      const depStepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const depStep = DependencyStepStub({
        id: depStepId,
        status: 'in_progress',
        dependsOn: [],
      });
      const step = DependencyStepStub({
        id: StepIdStub({ value: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' }),
        status: 'pending',
        dependsOn: [depStepId],
      });
      const allSteps = [depStep, step];

      const result = isStepReadyGuard({ step, allSteps });

      expect(result).toBe(false);
    });

    it('INVALID_DEPENDENCY: {one dependency complete, one pending} => returns false', () => {
      const depStepId1 = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const depStepId2 = StepIdStub({ value: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' });
      const depStep1 = DependencyStepStub({
        id: depStepId1,
        status: 'complete',
        dependsOn: [],
      });
      const depStep2 = DependencyStepStub({
        id: depStepId2,
        status: 'pending',
        dependsOn: [],
      });
      const step = DependencyStepStub({
        id: StepIdStub({ value: 'c3d4e5f6-a7b8-6c9d-0e1f-2a3b4c5d6e7f' }),
        status: 'pending',
        dependsOn: [depStepId1, depStepId2],
      });
      const allSteps = [depStep1, depStep2, step];

      const result = isStepReadyGuard({ step, allSteps });

      expect(result).toBe(false);
    });

    it('INVALID_DEPENDENCY: {dependency not found in allSteps} => returns false', () => {
      const missingDepId = StepIdStub({ value: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' });
      const step = DependencyStepStub({
        id: StepIdStub({ value: 'b2c3d4e5-f6a7-5b8c-9d0e-1f2a3b4c5d6e' }),
        status: 'pending',
        dependsOn: [missingDepId],
      });
      const allSteps = [step];

      const result = isStepReadyGuard({ step, allSteps });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {step: undefined} => returns false', () => {
      const allSteps = [DependencyStepStub()];

      const result = isStepReadyGuard({ allSteps });

      expect(result).toBe(false);
    });

    it('EMPTY: {allSteps: undefined} => returns false', () => {
      const step = DependencyStepStub({ status: 'pending' });

      const result = isStepReadyGuard({ step });

      expect(result).toBe(false);
    });

    it('EMPTY: {both undefined} => returns false', () => {
      const result = isStepReadyGuard({});

      expect(result).toBe(false);
    });
  });
});
