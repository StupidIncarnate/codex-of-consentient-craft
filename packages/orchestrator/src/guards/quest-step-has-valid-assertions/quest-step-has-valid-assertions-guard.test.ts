import {
  ContractNameStub,
  DependencyStepStub,
  StepAssertionStub,
} from '@dungeonmaster/shared/contracts';

import { questStepHasValidAssertionsGuard } from './quest-step-has-valid-assertions-guard';

describe('questStepHasValidAssertionsGuard', () => {
  describe('valid assertions', () => {
    it('VALID: {empty steps array} => returns true', () => {
      const result = questStepHasValidAssertionsGuard({ steps: [] });

      expect(result).toBe(true);
    });

    it('VALID: {step with non-Void outputContracts and VALID assertion} => returns true', () => {
      const steps = [
        DependencyStepStub({
          outputContracts: [ContractNameStub({ value: 'UserProfile' })],
          assertions: [StepAssertionStub({ prefix: 'VALID' })],
        }),
      ];

      const result = questStepHasValidAssertionsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {step with Void outputContracts and no VALID assertion} => returns true', () => {
      const steps = [
        DependencyStepStub({
          outputContracts: [ContractNameStub({ value: 'Void' })],
          assertions: [StepAssertionStub({ prefix: 'EDGE' })],
        }),
      ];

      const result = questStepHasValidAssertionsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {step with multiple assertions including VALID} => returns true', () => {
      const steps = [
        DependencyStepStub({
          outputContracts: [ContractNameStub({ value: 'UserProfile' })],
          assertions: [
            StepAssertionStub({ prefix: 'EDGE' }),
            StepAssertionStub({
              prefix: 'VALID',
              input: '{second assertion}',
              expected: 'returns correctly',
            }),
            StepAssertionStub({
              prefix: 'EMPTY',
              input: '{empty input}',
              expected: 'returns empty',
            }),
          ],
        }),
      ];

      const result = questStepHasValidAssertionsGuard({ steps });

      expect(result).toBe(true);
    });
  });

  describe('missing valid assertion', () => {
    it('INVALID_ASSERTION: {step with non-Void outputContracts but only EDGE assertions} => returns false', () => {
      const steps = [
        DependencyStepStub({
          outputContracts: [ContractNameStub({ value: 'UserProfile' })],
          assertions: [StepAssertionStub({ prefix: 'EDGE' })],
        }),
      ];

      const result = questStepHasValidAssertionsGuard({ steps });

      expect(result).toBe(false);
    });

    it('INVALID_ASSERTION: {step with non-Void outputContracts but only EMPTY assertions} => returns false', () => {
      const steps = [
        DependencyStepStub({
          outputContracts: [ContractNameStub({ value: 'AuthToken' })],
          assertions: [StepAssertionStub({ prefix: 'EMPTY' })],
        }),
      ];

      const result = questStepHasValidAssertionsGuard({ steps });

      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {mix of steps, one with non-Void has VALID, other with Void has no VALID} => returns true', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          outputContracts: [ContractNameStub({ value: 'UserProfile' })],
          assertions: [StepAssertionStub({ prefix: 'VALID' })],
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          outputContracts: [ContractNameStub({ value: 'Void' })],
          assertions: [StepAssertionStub({ prefix: 'EDGE' })],
        }),
      ];

      const result = questStepHasValidAssertionsGuard({ steps });

      expect(result).toBe(true);
    });

    it('EDGE: {multiple non-Void steps, one missing VALID assertion} => returns false', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          outputContracts: [ContractNameStub({ value: 'UserProfile' })],
          assertions: [StepAssertionStub({ prefix: 'VALID' })],
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          outputContracts: [ContractNameStub({ value: 'AuthToken' })],
          assertions: [StepAssertionStub({ prefix: 'EDGE' })],
        }),
      ];

      const result = questStepHasValidAssertionsGuard({ steps });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {steps: undefined} => returns false', () => {
      const result = questStepHasValidAssertionsGuard({});

      expect(result).toBe(false);
    });
  });
});
