import { DependencyStepStub, StepAssertionStub } from '@dungeonmaster/shared/contracts';

import { questStepHasValidAssertionsGuard } from './quest-step-has-valid-assertions-guard';

describe('questStepHasValidAssertionsGuard', () => {
  describe('valid assertions', () => {
    it('VALID: {empty steps array} => returns true', () => {
      const result = questStepHasValidAssertionsGuard({ steps: [] });

      expect(result).toBe(true);
    });

    it('VALID: {step with one assertion} => returns true', () => {
      const steps = [
        DependencyStepStub({
          assertions: [StepAssertionStub({ prefix: 'VALID' })],
        }),
      ];

      const result = questStepHasValidAssertionsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {step with only EDGE assertion} => returns true', () => {
      const steps = [
        DependencyStepStub({
          assertions: [StepAssertionStub({ prefix: 'EDGE' })],
        }),
      ];

      const result = questStepHasValidAssertionsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {step with multiple assertions} => returns true', () => {
      const steps = [
        DependencyStepStub({
          assertions: [
            StepAssertionStub({ prefix: 'VALID' }),
            StepAssertionStub({
              prefix: 'EDGE',
              input: '{edge case}',
              expected: 'handles edge',
            }),
          ],
        }),
      ];

      const result = questStepHasValidAssertionsGuard({ steps });

      expect(result).toBe(true);
    });

    it('VALID: {multiple steps each with assertions} => returns true', () => {
      const steps = [
        DependencyStepStub({
          id: 'e5f6a7b8-c9d0-4e1f-a2b3-4c5d6e7f8a9b',
          assertions: [StepAssertionStub({ prefix: 'VALID' })],
        }),
        DependencyStepStub({
          id: 'f6a7b8c9-d0e1-4f2a-b3c4-5d6e7f8a9b0c',
          assertions: [StepAssertionStub({ prefix: 'EDGE' })],
        }),
      ];

      const result = questStepHasValidAssertionsGuard({ steps });

      expect(result).toBe(true);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {steps: undefined} => returns false', () => {
      const result = questStepHasValidAssertionsGuard({});

      expect(result).toBe(false);
    });
  });
});
