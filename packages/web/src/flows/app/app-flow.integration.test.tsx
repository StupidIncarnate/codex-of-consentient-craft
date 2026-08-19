import { appRouteTreeHarness } from '../../../test/harnesses/app-route-tree/app-route-tree.harness';

import { AppFlow } from './app-flow';

describe('AppFlow', () => {
  describe('export', () => {
    it('VALID: {} => exports AppFlow function', () => {
      expect(AppFlow).toStrictEqual(expect.any(Function));
    });
  });

  describe('composed route tree', () => {
    const harness = appRouteTreeHarness();

    it('VALID: {/health} => renders HEALTH_PAGE inside APP_MAP_CONTAINER', () => {
      harness.mountAt({ path: '/health' });

      expect({
        hasMapContainer: harness.hasMapContainer(),
        hasHealthPageInsideMapContainer: harness.hasHealthPageInsideMapContainer(),
      }).toStrictEqual({
        hasMapContainer: true,
        hasHealthPageInsideMapContainer: true,
      });
    });

    it('VALID: {/not-a-real-route} => renders neither APP_MAP_CONTAINER nor HEALTH_PAGE', () => {
      harness.mountAt({ path: '/not-a-real-route' });

      expect({
        hasMapContainer: harness.hasMapContainer(),
        hasHealthPageAnywhere: harness.hasHealthPageAnywhere(),
      }).toStrictEqual({
        hasMapContainer: false,
        hasHealthPageAnywhere: false,
      });
    });
  });
});
