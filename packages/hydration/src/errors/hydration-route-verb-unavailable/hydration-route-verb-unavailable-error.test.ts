import { HydrationRouteVerbUnavailableError } from './hydration-route-verb-unavailable-error';

describe('HydrationRouteVerbUnavailableError', () => {
  describe('constructor()', () => {
    it('VALID: {recipeName, ingredientName, verb: "remove"} => names the recipe, the ingredient and the verb', () => {
      const error = new HydrationRouteVerbUnavailableError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'operation',
        verb: 'remove',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationRouteVerbUnavailableError',
        message:
          'recipe "guild-mid-execution": ingredient "operation" declares no "remove" route, so a call needing one cannot run',
      });
    });

    it('EDGE: {verb: "query"} => names the query verb instead', () => {
      const error = new HydrationRouteVerbUnavailableError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        verb: 'query',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationRouteVerbUnavailableError',
        message:
          'recipe "guild-mid-execution": ingredient "guild" declares no "query" route, so a call needing one cannot run',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HydrationRouteVerbUnavailableError => returns true', () => {
      const error = new HydrationRouteVerbUnavailableError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'operation',
        verb: 'remove',
      });

      expect(error instanceof HydrationRouteVerbUnavailableError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HydrationRouteVerbUnavailableError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'operation',
        verb: 'remove',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
