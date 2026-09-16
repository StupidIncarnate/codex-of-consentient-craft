import { HydrationQueryFailedError } from './hydration-query-failed-error';

describe('HydrationQueryFailedError', () => {
  describe('constructor()', () => {
    it('VALID: {where, cause: connection refused} => names the ingredient, the filter and the underlying failure', () => {
      const error = new HydrationQueryFailedError({
        recipeName: 'drop-riftcarver-item',
        ingredientName: 'operation',
        where: '{"role":"riftcarver"}',
        cause: new Error('connect ECONNREFUSED'),
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationQueryFailedError',
        message:
          'recipe "drop-riftcarver-item": ingredient "operation" filter where {"role":"riftcarver"} could not query: Error: connect ECONNREFUSED',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HydrationQueryFailedError => returns true', () => {
      const error = new HydrationQueryFailedError({
        recipeName: 'drop-riftcarver-item',
        ingredientName: 'operation',
        where: '{}',
        cause: new Error('x'),
      });

      expect(error instanceof HydrationQueryFailedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HydrationQueryFailedError({
        recipeName: 'drop-riftcarver-item',
        ingredientName: 'operation',
        where: '{}',
        cause: new Error('x'),
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
