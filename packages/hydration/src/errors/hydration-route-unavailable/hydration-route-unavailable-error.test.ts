import { HydrationRouteUnavailableError } from './hydration-route-unavailable-error';

describe('HydrationRouteUnavailableError', () => {
  describe('constructor()', () => {
    it('VALID: {recipeName, ingredientName, availableRoutes: [api], targetLacks} => names the recipe, the ingredient, its routes and the gap', () => {
      const error = new HydrationRouteUnavailableError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        availableRoutes: ['api'],
        targetLacks: 'a baseUrl, so the api route has nothing to call',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationRouteUnavailableError',
        message:
          'recipe "guild-mid-execution": ingredient "guild" needs a route this target cannot serve. Routes it declares: api. The target lacks a baseUrl, so the api route has nothing to call',
      });
    });

    it('EDGE: {availableRoutes: [api, write]} => lists every route the ingredient declares', () => {
      const error = new HydrationRouteUnavailableError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'session',
        availableRoutes: ['api', 'write'],
        targetLacks: 'a baseUrl',
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationRouteUnavailableError',
        message:
          'recipe "guild-mid-execution": ingredient "session" needs a route this target cannot serve. Routes it declares: api, write. The target lacks a baseUrl',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HydrationRouteUnavailableError => returns true', () => {
      const error = new HydrationRouteUnavailableError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        availableRoutes: ['api'],
        targetLacks: 'a baseUrl',
      });

      expect(error instanceof HydrationRouteUnavailableError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HydrationRouteUnavailableError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        availableRoutes: ['api'],
        targetLacks: 'a baseUrl',
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
