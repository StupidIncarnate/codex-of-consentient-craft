import { routeSelectTransformer } from './route-select-transformer';
import { HydrationRoutesStub } from '../../contracts/hydration-routes/hydration-routes.stub';

describe('routeSelectTransformer', () => {
  describe('an ingredient declaring both api and write', () => {
    it('VALID: {routes: {api, write}, hasBaseUrl: true} => returns "api"', () => {
      const apiRoute = (): unknown => undefined;
      const writeRoute = (): unknown => undefined;
      const routes = HydrationRoutesStub({ api: apiRoute, write: writeRoute });

      const result = routeSelectTransformer({ routes, hasBaseUrl: true });

      expect(result).toBe('api');
    });

    it('VALID: {routes: {api, write}, hasBaseUrl: false} => returns "write"', () => {
      const apiRoute = (): unknown => undefined;
      const writeRoute = (): unknown => undefined;
      const routes = HydrationRoutesStub({ api: apiRoute, write: writeRoute });

      const result = routeSelectTransformer({ routes, hasBaseUrl: false });

      expect(result).toBe('write');
    });
  });

  describe('an ingredient declaring only api', () => {
    it('VALID: {routes: {api}, hasBaseUrl: true} => returns "api"', () => {
      const apiRoute = (): unknown => undefined;
      const routes = HydrationRoutesStub({ api: apiRoute, write: undefined });

      const result = routeSelectTransformer({ routes, hasBaseUrl: true });

      expect(result).toBe('api');
    });

    it('VALID: {routes: {api}, hasBaseUrl: false} => returns null', () => {
      const apiRoute = (): unknown => undefined;
      const routes = HydrationRoutesStub({ api: apiRoute, write: undefined });

      const result = routeSelectTransformer({ routes, hasBaseUrl: false });

      expect(result).toBe(null);
    });
  });

  describe('an ingredient declaring only write', () => {
    it('VALID: {routes: {write}, hasBaseUrl: true} => returns "write"', () => {
      const writeRoute = (): unknown => undefined;
      const routes = HydrationRoutesStub({ write: writeRoute });

      const result = routeSelectTransformer({ routes, hasBaseUrl: true });

      expect(result).toBe('write');
    });

    it('VALID: {routes: {write}, hasBaseUrl: false} => returns "write"', () => {
      const writeRoute = (): unknown => undefined;
      const routes = HydrationRoutesStub({ write: writeRoute });

      const result = routeSelectTransformer({ routes, hasBaseUrl: false });

      expect(result).toBe('write');
    });
  });
});
