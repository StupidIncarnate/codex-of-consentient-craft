/**
 * PURPOSE: Loads an entry point with top-level side effects inside a fresh, isolated module registry,
 * with the named modules replaced through doMock first. Reach for this over registerModuleMock when the
 * replacement must apply to one load of the entry point only, not to the whole test file.
 *
 * USAGE:
 * await modulesIsolateMiddleware({ mocks: [{ module: filePathContract.parse('/abs/path/to/module'), factory: () => ({}) }], entrypoint: filePathContract.parse('/abs/path/to/index') });
 * // Loads entrypoint in an isolated module scope with specified modules mocked
 */
import {
  doMock as gatewayDoMock,
  isolateModulesAsync as gatewayIsolateModulesAsync,
} from '#gateway/npm/jest__globals';
import type { IsolateModulesMock } from '../../contracts/isolate-modules-mock/isolate-modules-mock-contract';

export const modulesIsolateMiddleware = async ({
  mocks,
  entrypoint,
}: {
  mocks: IsolateModulesMock[];
  entrypoint: string;
}): Promise<void> => {
  await gatewayIsolateModulesAsync({
    fn: async () => {
      for (const mock of mocks) {
        gatewayDoMock({ moduleName: mock.module, factory: mock.factory });
      }

      await import(entrypoint);
    },
  });
};
