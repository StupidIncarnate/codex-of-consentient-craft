/**
 * PURPOSE: Test proxy for driverSessionState — exposes `setupEmpty()` to clear the module-level
 * singleton before a test runs, since the state itself runs real (no workspace testing import
 * needed) and a proxy constructor may only create child proxies and set up mocks, never carry a
 * side effect of its own.
 *
 * USAGE:
 * const proxy = driverSessionStateProxy();
 * proxy.setupEmpty();
 */

import { driverSessionState } from './driver-session-state';

export const driverSessionStateProxy = (): {
  setupEmpty: () => void;
} => ({
  setupEmpty: (): void => {
    driverSessionState.clear();
  },
});
