import { hydrationRoutesContract } from './hydration-routes-contract';
import { HydrationRoutesStub } from './hydration-routes.stub';

describe('hydrationRoutesContract', () => {
  describe('valid route declarations', () => {
    it('VALID: {write: fn} => returns the write route', () => {
      const writeRoute = (): unknown => undefined;

      expect(HydrationRoutesStub({ write: writeRoute })).toStrictEqual({ write: writeRoute });
    });

    it('VALID: {api: fn, write: fn} => returns both', () => {
      const apiRoute = (): unknown => undefined;
      const writeRoute = (): unknown => undefined;

      expect(HydrationRoutesStub({ api: apiRoute, write: writeRoute })).toStrictEqual({
        api: apiRoute,
        write: writeRoute,
      });
    });

    it('VALID: {write: fn, query: fn, update: fn, remove: fn} => returns all four', () => {
      const writeRoute = (): unknown => undefined;
      const queryRoute = (): unknown => undefined;
      const updateRoute = (): unknown => undefined;
      const removeRoute = (): unknown => undefined;

      expect(
        HydrationRoutesStub({
          write: writeRoute,
          query: queryRoute,
          update: updateRoute,
          remove: removeRoute,
        }),
      ).toStrictEqual({
        write: writeRoute,
        query: queryRoute,
        update: updateRoute,
        remove: removeRoute,
      });
    });
  });

  describe('invalid route declarations', () => {
    it('INVALID: {} => throws "an ingredient must declare at least one route"', () => {
      expect(() => hydrationRoutesContract.parse({})).toThrow(
        /an ingredient must declare at least one route/u,
      );
    });

    it('INVALID: {query: fn} alone => throws "an ingredient must declare at least one route"', () => {
      const queryRoute = (): unknown => undefined;

      expect(() => hydrationRoutesContract.parse({ query: queryRoute })).toThrow(
        /an ingredient must declare at least one route/u,
      );
    });
  });
});
