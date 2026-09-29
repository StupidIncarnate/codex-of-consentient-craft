import { doMockProxy } from '#gateway/npm/jest__globals/do-mock/do-mock.proxy';
import { fnProxy } from '#gateway/npm/jest__globals/fn/fn.proxy';
import { resetModulesProxy } from '#gateway/npm/jest__globals/reset-modules/reset-modules.proxy';

export const childProcessMockMiddlewareProxy = (): Record<PropertyKey, never> => {
  doMockProxy();
  fnProxy();
  resetModulesProxy();

  return {};
};
