import { routeSelectTransformer } from './route-select-transformer';
import { HydrationRoutesStub } from '../../contracts/hydration-routes/hydration-routes.stub';

describe('routeSelectTransformer', () => {
  describe('a target with a base URL', () => {
    it('VALID: {routes: {api, write}, hasBaseUrl: true} => returns "api"', () => {
      const apiRoute = (): unknown => undefined;
      const writeRoute = (): unknown => undefined;
      const routes = HydrationRoutesStub({ api: apiRoute, write: writeRoute });

      const result = routeSelectTransformer({ routes, hasBaseUrl: true });

      expect(result).toBe('api');
    });
  });

  describe('a target with no base URL', () => {
    it('VALID: {routes: {api, write}, hasBaseUrl: false} => returns "write"', () => {
      const apiRoute = (): unknown => undefined;
      const writeRoute = (): unknown => undefined;
      const routes = HydrationRoutesStub({ api: apiRoute, write: writeRoute });

      const result = routeSelectTransformer({ routes, hasBaseUrl: false });

      expect(result).toBe('write');
    });

    it('VALID: {routes: {api}, hasBaseUrl: false} => returns null', () => {
      const apiRoute = (): unknown => undefined;
      const routes = HydrationRoutesStub({ api: apiRoute, write: undefined });

      const result = routeSelectTransformer({ routes, hasBaseUrl: false });

      expect(result).toBe(null);
    });

    it('VALID: {routes: {recording}, hasBaseUrl: false} => returns "recording"', () => {
      const recordingRoute = (): unknown => undefined;
      const routes = HydrationRoutesStub({ recording: recordingRoute, write: undefined });

      const result = routeSelectTransformer({ routes, hasBaseUrl: false });

      expect(result).toBe('recording');
    });

    it('VALID: {routes: {write, recording}, hasBaseUrl: false} => returns "write"', () => {
      const writeRoute = (): unknown => undefined;
      const recordingRoute = (): unknown => undefined;
      const routes = HydrationRoutesStub({ write: writeRoute, recording: recordingRoute });

      const result = routeSelectTransformer({ routes, hasBaseUrl: false });

      expect(result).toBe('write');
    });
  });
});
