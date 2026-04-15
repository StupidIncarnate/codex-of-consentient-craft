import { DependencyStepStub } from '@dungeonmaster/shared/contracts';

import { questStepsMissingFocusTargetTransformer } from './quest-steps-missing-focus-target-transformer';

describe('questStepsMissingFocusTargetTransformer', () => {
  describe('steps with focus targets', () => {
    it('VALID: {step with focusFile} => returns []', () => {
      const step = DependencyStepStub({ id: 'step-1' as never });

      const result = questStepsMissingFocusTargetTransformer({ steps: [step] });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {step with focusAction only} => returns []', () => {
      const step = DependencyStepStub({
        id: 'verify-step' as never,
        focusFile: undefined,
        focusAction: { kind: 'verification', description: 'run ward' as never },
      });

      const result = questStepsMissingFocusTargetTransformer({ steps: [step] });

      expect(result).toStrictEqual([]);
    });
  });

  describe('steps missing both focus targets', () => {
    it('INVALID: {step with neither focusFile nor focusAction} => returns description', () => {
      const step = DependencyStepStub({
        id: 'bad-step' as never,
        focusFile: undefined,
      });

      const result = questStepsMissingFocusTargetTransformer({ steps: [step] });

      expect(result).toStrictEqual(["step 'bad-step' has neither focusFile nor focusAction"]);
    });
  });

  describe('empty', () => {
    it('EMPTY: {steps: undefined} => returns []', () => {
      const result = questStepsMissingFocusTargetTransformer({});

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {steps: []} => returns []', () => {
      const result = questStepsMissingFocusTargetTransformer({ steps: [] });

      expect(result).toStrictEqual([]);
    });
  });
});
