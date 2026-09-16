import { HydrationFilterExpectationError } from './hydration-filter-expectation-error';

describe('HydrationFilterExpectationError', () => {
  describe('constructor()', () => {
    it('VALID: {where, expect: "some", matchedCount: 0} => names the ingredient, the filter and the zero match', () => {
      const error = new HydrationFilterExpectationError({
        recipeName: 'drop-riftcarver-item',
        ingredientName: 'operation',
        where: '{"role":"riftcarver"}',
        expect: 'some',
        matchedCount: 0,
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationFilterExpectationError',
        message:
          'recipe "drop-riftcarver-item": ingredient "operation" filter where {"role":"riftcarver"} expected "some" but matched 0 row(s)',
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

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationFilterExpectationError',
        message:
          'recipe "drop-riftcarver-item": ingredient "operation" filter where {"role":"riftcarver"} expected "one" but matched 2 row(s)',
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
