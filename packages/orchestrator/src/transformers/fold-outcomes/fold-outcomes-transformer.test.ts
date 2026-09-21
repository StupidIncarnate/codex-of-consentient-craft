import { StepOutcomeStub } from '../../contracts/step-outcome/step-outcome.stub';
import { foldOutcomesTransformer } from './fold-outcomes-transformer';

describe('foldOutcomesTransformer', () => {
  describe('empty outcomes', () => {
    it('EMPTY: {outcomes: []} => returns empty, not a throw', () => {
      const result = foldOutcomesTransformer({ outcomes: [] });

      expect(result).toBe('empty');
    });
  });

  describe('worst-first precedence, both argument orders', () => {
    const PRECEDENCE_PAIRS = [
      [StepOutcomeStub({ value: 'wall' }), StepOutcomeStub({ value: 'unmet' }), 'wall'],
      [StepOutcomeStub({ value: 'unmet' }), StepOutcomeStub({ value: 'wall' }), 'wall'],
      [StepOutcomeStub({ value: 'wall' }), StepOutcomeStub({ value: 'done' }), 'wall'],
      [StepOutcomeStub({ value: 'done' }), StepOutcomeStub({ value: 'wall' }), 'wall'],
      [StepOutcomeStub({ value: 'wall' }), StepOutcomeStub({ value: 'empty' }), 'wall'],
      [StepOutcomeStub({ value: 'empty' }), StepOutcomeStub({ value: 'wall' }), 'wall'],
      [StepOutcomeStub({ value: 'unmet' }), StepOutcomeStub({ value: 'done' }), 'unmet'],
      [StepOutcomeStub({ value: 'done' }), StepOutcomeStub({ value: 'unmet' }), 'unmet'],
      [StepOutcomeStub({ value: 'unmet' }), StepOutcomeStub({ value: 'empty' }), 'unmet'],
      [StepOutcomeStub({ value: 'empty' }), StepOutcomeStub({ value: 'unmet' }), 'unmet'],
      [StepOutcomeStub({ value: 'done' }), StepOutcomeStub({ value: 'empty' }), 'done'],
      [StepOutcomeStub({ value: 'empty' }), StepOutcomeStub({ value: 'done' }), 'done'],
    ] as const;

    it.each(PRECEDENCE_PAIRS)(
      'VALID: {outcomes: [%s, %s]} => folds to %s',
      (first, second, expected) => {
        const result = foldOutcomesTransformer({ outcomes: [first, second] });

        expect(result).toBe(expected);
      },
    );
  });
});
