import { requireActualProxy } from '#gateway/npm/jest__globals/require-actual/require-actual.proxy';

export const jestRequireActualAdapterProxy = (): Record<PropertyKey, never> => {
  requireActualProxy();

  return {};
};
