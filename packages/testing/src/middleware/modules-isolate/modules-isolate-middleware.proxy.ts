import { doMockProxy } from '#gateway/npm/jest__globals/do-mock/do-mock.proxy';
import { isolateModulesAsyncProxy } from '#gateway/npm/jest__globals/isolate-modules-async/isolate-modules-async.proxy';
import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';

export const modulesIsolateMiddlewareProxy = (): {
  setupRealEntrypointLoad: (params: { entrypoint: string }) => void;
} => {
  isolateModulesAsyncProxy();
  doMockProxy();
  const dynamicImportChild = dynamicImportProxy();

  return {
    // The middleware exists to load its entrypoint for real inside the isolated registry, so the
    // test stages a real load of exactly that entrypoint.
    setupRealEntrypointLoad: ({ entrypoint }: { entrypoint: string }): void => {
      dynamicImportChild.loadsReal({ path: entrypoint });
    },
  };
};
