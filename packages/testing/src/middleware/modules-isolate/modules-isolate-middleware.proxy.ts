import { doMockProxy } from '#gateway/npm/jest__globals/do-mock/do-mock.proxy';
import { isolateModulesAsyncProxy } from '#gateway/npm/jest__globals/isolate-modules-async/isolate-modules-async.proxy';
import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';
import { dynamicImport } from '#gateway/node/module';
import { actualModuleRequireMiddleware } from '../actual-module-require/actual-module-require-middleware';
import { mockRegisterMiddleware } from '../mock-register/mock-register-middleware';

export const modulesIsolateMiddlewareProxy = (): Record<PropertyKey, never> => {
  isolateModulesAsyncProxy();
  doMockProxy();
  dynamicImportProxy();

  // The whole point of this middleware is a REAL load of the entrypoint inside the isolated
  // registry, so the mocked wrapper passes every call through to the actual `import()`. The
  // wrapper file itself is required, not the `#gateway/node/module` barrel: the barrel re-exports
  // the mocked binding.
  const realWrapper = actualModuleRequireMiddleware<{ dynamicImport: typeof dynamicImport }>({
    module: '../../../../@gateway/node/src/module/dynamic-import/dynamic-import',
  });
  mockRegisterMiddleware({ fn: dynamicImport }).calledWith([]).implement(realWrapper.dynamicImport);

  return {};
};
