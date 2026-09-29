import { doMockProxy } from '#gateway/npm/jest__globals/do-mock/do-mock.proxy';
import { isolateModulesAsyncProxy } from '#gateway/npm/jest__globals/isolate-modules-async/isolate-modules-async.proxy';

export const modulesIsolateMiddlewareProxy = (): Record<PropertyKey, never> => {
  isolateModulesAsyncProxy();
  doMockProxy();

  return {};
};
