/**
 * PURPOSE: Test proxy for recipesScaffoldState — exposes `setupEmpty()` to clear the module-level
 * singleton before a test runs, since the state itself runs real and a proxy constructor may only
 * create child proxies and set up mocks, never carry a side effect of its own.
 *
 * USAGE:
 * const proxy = recipesScaffoldStateProxy();
 * proxy.setupEmpty();
 */

import { recipesScaffoldState } from './recipes-scaffold-state';

export const recipesScaffoldStateProxy = (): {
  setupEmpty: () => void;
} => ({
  setupEmpty: (): void => {
    recipesScaffoldState.clear();
  },
});
