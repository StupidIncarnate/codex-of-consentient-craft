import { HydrationRouteFailedError } from './hydration-route-failed-error';

describe('HydrationRouteFailedError', () => {
  describe('constructor()', () => {
    it('VALID: {status: 500, responseBody} => names the route, the URL, the status and the body verbatim', () => {
      const error = new HydrationRouteFailedError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        route: 'api',
        url: 'http://localhost:3737/api/guilds',
        status: 500,
        responseBody: '{"error":"database unavailable"}',
        cause: null,
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationRouteFailedError',
        message:
          'recipe "guild-mid-execution": ingredient "guild"\'s "api" route at http://localhost:3737/api/guilds answered 500 with body: {"error":"database unavailable"}',
      });
    });

    it('ERROR: {status: null, cause: connection refused} => names the route and the underlying connection failure', () => {
      const error = new HydrationRouteFailedError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        route: 'api',
        url: 'http://localhost:3737/api/guilds',
        status: null,
        responseBody: null,
        cause: new Error('connect ECONNREFUSED 127.0.0.1:3737'),
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationRouteFailedError',
        message:
          'recipe "guild-mid-execution": ingredient "guild"\'s "api" route at http://localhost:3737/api/guilds refused the connection: Error: connect ECONNREFUSED 127.0.0.1:3737',
      });
    });

    it('EMPTY: {url: null, cause: connection refused} => names the failure honestly, with no fabricated URL', () => {
      const error = new HydrationRouteFailedError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        route: 'api',
        url: null,
        status: null,
        responseBody: null,
        cause: new Error('connect ECONNREFUSED 127.0.0.1:3737'),
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationRouteFailedError',
        message:
          'recipe "guild-mid-execution": ingredient "guild"\'s "api" route failed with no URL known: Error: connect ECONNREFUSED 127.0.0.1:3737',
      });
    });

    it('EMPTY: {status: 404, responseBody: null} => names the status with an empty body', () => {
      const error = new HydrationRouteFailedError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        route: 'api',
        url: 'http://localhost:3737/api/guilds/nope',
        status: 404,
        responseBody: null,
        cause: null,
      });

      expect({ name: error.name, message: error.message }).toStrictEqual({
        name: 'HydrationRouteFailedError',
        message:
          'recipe "guild-mid-execution": ingredient "guild"\'s "api" route at http://localhost:3737/api/guilds/nope answered 404 with body: (empty)',
      });
    });
  });

  describe('error inheritance', () => {
    it('VALID: error instanceof HydrationRouteFailedError => returns true', () => {
      const error = new HydrationRouteFailedError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        route: 'api',
        url: 'http://localhost:3737/api/guilds',
        status: 500,
        responseBody: '{}',
        cause: null,
      });

      expect(error instanceof HydrationRouteFailedError).toBe(true);
    });

    it('VALID: error instanceof Error => returns true', () => {
      const error = new HydrationRouteFailedError({
        recipeName: 'guild-mid-execution',
        ingredientName: 'guild',
        route: 'api',
        url: 'http://localhost:3737/api/guilds',
        status: 500,
        responseBody: '{}',
        cause: null,
      });

      expect(error instanceof Error).toBe(true);
    });
  });
});
