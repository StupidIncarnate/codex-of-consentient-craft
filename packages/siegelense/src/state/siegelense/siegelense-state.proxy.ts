/**
 * PURPOSE: Starting point test proxy for siegelenseState — replace with real mocks as the package
 * grows. Clears the module-level store directly, with no workspace testing import, so each test
 * starts from empty.
 *
 * USAGE:
 * const proxy = siegelenseStateProxy();
 * proxy.setupEmpty();
 */

import { siegelenseState } from './siegelense-state';

export const siegelenseStateProxy = (): {
  setupEmpty: () => void;
} => ({
  setupEmpty: (): void => {
    siegelenseState.clear();
  },
});
