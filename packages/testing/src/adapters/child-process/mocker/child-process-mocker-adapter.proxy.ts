/**
 * Empty proxy - This adapter mocks child_process itself
 * No proxy needed because childProcessMockerAdapter returns methods that mock child_process.spawn directly
 */

import { doMockProxy } from '#gateway/npm/jest__globals/do-mock/do-mock.proxy';
import { fnProxy } from '#gateway/npm/jest__globals/fn/fn.proxy';
import { resetModulesProxy } from '#gateway/npm/jest__globals/reset-modules/reset-modules.proxy';

export const childProcessMockerAdapterProxy = (): Record<PropertyKey, never> => {
  doMockProxy();
  fnProxy();
  resetModulesProxy();

  return {};
};
