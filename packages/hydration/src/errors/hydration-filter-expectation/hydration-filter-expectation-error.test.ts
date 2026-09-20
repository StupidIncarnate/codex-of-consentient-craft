import { HydrationFilterExpectationError } from './hydration-filter-expectation-error';

describe('HydrationFilterExpectationError', () => {
  describe('constructor()', () => {
    it('VALID: {where, expect: "some", matchedCount: 0} => names the ingredient, the filter and the zero match and defaults candidates to []', () => {
      const error = new HydrationFilterExpectationError({
        recipeName: 'drop-riftcarver-item',
        ingredientName: 'operation',
        where: '{"role":"riftcarver"}',
        expect: 'some',
        matchedCount: 0,
      });

      expect({
        name: error.name,
        message: error.message,
        candidates: error.candidates,
      }).toStrictEqual({
        name: 'HydrationFilterExpectationError',
        message:
          'recipe "drop-riftcarver-item": ingredient "operation" filter where {"role":"riftcarver"} expected "some" but matched 0 row(s)',
        candidates: [],
      });
    });

    it('EDGE: {expect: "one", matchedCount: 2} => names a match count over the expected upper bound', () => {
      const error = new HydrationFilterExpectationError({
        recipeName: 'drop-riftcarver-item',
        ingredientName: 'operation',
        where: '{"role":"riftcarver"}',
        expect: 'one',
        matchedCount: 2,
      });

      expect({
        name: error.name,
        message: error.message,
        candidates: error.candidates,
      }).toStrictEqual({
        name: 'HydrationFilterExpectationError',
        message:
          'recipe "drop-riftcarver-item": ingredient "operation" filter where {"role":"riftcarver"} expected "one" but matched 2 row(s)',
        candidates: [],
      });
    });

    it('VALID: {expect: "one", matchedCount: 2, candidates: 2 rows} => populates candidates and renders them in error message', () => {
      const candidates: Record<string, unknown>[] = [];
      candidates.push({ id: 'op-1', role: 'ward' });
      candidates.push({ id: 'op-2', role: 'ward' });
      const error = new HydrationFilterExpectationError({
        recipeName: 'drop-riftcarver-item',
        ingredientName: 'operation',
        where: '{"role":"riftcarver"}',
        expect: 'one',
        matchedCount: 2,
        candidates,
      });

      expect({
        name: error.name,
        message: error.message,
        candidates: error.candidates,
      }).toStrictEqual({
        name: 'HydrationFilterExpectationError',
        message:
          'recipe "drop-riftcarver-item": ingredient "operation" filter where {"role":"riftcarver"} expected "one" but matched 2 row(s)\nCandidates (2):\n  [0]: {"id":"op-1","role":"ward"}\n  [1]: {"id":"op-2","role":"ward"}',
        candidates,
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HydrationFilterExpectationError => returns true', () => {
      const error = new HydrationFilterExpectationError({
        recipeName: 'drop-riftcarver-item',
        ingredientName: 'operation',
        where: '{}',
        expect: 'some',
        matchedCount: 0,
      });

      expect(error instanceof HydrationFilterExpectationError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HydrationFilterExpectationError({
        recipeName: 'drop-riftcarver-item',
        ingredientName: 'operation',
        where: '{}',
        expect: 'some',
        matchedCount: 0,
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
