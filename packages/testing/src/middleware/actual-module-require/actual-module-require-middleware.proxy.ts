import { requireActualProxy } from '#gateway/npm/jest__globals/require-actual/require-actual.proxy';

export const actualModuleRequireMiddlewareProxy = (): Record<PropertyKey, never> => {
  requireActualProxy();

  return {};
};
