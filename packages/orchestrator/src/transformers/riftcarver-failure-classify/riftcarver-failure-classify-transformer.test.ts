import { worktreePrepareStepStatics } from '../../statics/worktree-prepare-step/worktree-prepare-step-statics';
import { riftcarverFailureClassifyTransformer } from './riftcarver-failure-classify-transformer';

// Derived from the statics object, never hand-listed — an eighth step added there is picked up
// here automatically, which is the whole point of the transformer under test. The expected word
// is folded in here, OUTSIDE any test body, so the test itself holds no conditional.
const CLASSIFICATION_CASES = Object.entries(worktreePrepareStepStatics.classifications).map(
  ([step, classification]) => [step, classification === 'repairable' ? 'unmet' : 'wall'] as const,
);

describe('riftcarverFailureClassifyTransformer', () => {
  describe('every classified step, derived over Object.entries', () => {
    it.each(CLASSIFICATION_CASES)(
      'VALID: {failedStep: %s} => classifies %s',
      (step, expectedWord) => {
        const result = riftcarverFailureClassifyTransformer({
          failedStep: step,
          error: new Error('carve step failed'),
        });

        expect(result).toBe(expectedWord);
      },
    );
  });

  describe('permission denial overrides the step class', () => {
    it('ERROR: {failedStep: typecheck, EACCES error} => classifies wall despite typecheck being repairable', () => {
      const result = riftcarverFailureClassifyTransformer({
        failedStep: worktreePrepareStepStatics.steps.typecheck,
        error: new Error('EACCES: permission denied, mkdir /repo/wt'),
      });

      expect(result).toBe('wall');
    });
  });

  describe('an unrecognised step', () => {
    it('EDGE: {failedStep: "unknown-step"} => classifies wall — no class means no repair route', () => {
      const result = riftcarverFailureClassifyTransformer({
        failedStep: 'unknown-step',
        error: new Error('x'),
      });

      expect(result).toBe('wall');
    });
  });
});
