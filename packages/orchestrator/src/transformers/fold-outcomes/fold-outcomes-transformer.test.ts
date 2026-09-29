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
      ['wall', 'unmet', 'wall'],
      ['unmet', 'wall', 'wall'],
      ['wall', 'done', 'wall'],
      ['done', 'wall', 'wall'],
      ['wall', 'empty', 'wall'],
      ['empty', 'wall', 'wall'],
      ['unmet', 'done', 'unmet'],
      ['done', 'unmet', 'unmet'],
      ['unmet', 'empty', 'unmet'],
      ['empty', 'unmet', 'unmet'],
      ['done', 'empty', 'done'],
      ['empty', 'done', 'done'],
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
