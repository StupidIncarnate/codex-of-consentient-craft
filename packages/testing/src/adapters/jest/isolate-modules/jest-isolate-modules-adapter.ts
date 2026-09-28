/**
 * PURPOSE: Wraps jest.isolateModulesAsync and jest.doMock for entry point testing without direct jest API usage in proxies
 *
 * USAGE:
 * await jestIsolateModulesAdapter({ mocks: [{ module: filePathContract.parse('/abs/path/to/module'), factory: () => ({}) }], entrypoint: filePathContract.parse('/abs/path/to/index') });
 * // Loads entrypoint in an isolated module scope with specified modules mocked
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import {
  doMock as gatewayDoMock,
  isolateModulesAsync as gatewayIsolateModulesAsync,
} from '#gateway/npm/jest__globals';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export interface IsolateModulesMock {
  module: FilePath;
  factory: () => Record<PropertyKey, unknown>;
}

export const jestIsolateModulesAdapter = async ({
  mocks,
  entrypoint,
}: {
  mocks: IsolateModulesMock[];
  entrypoint: FilePath;
}): Promise<AdapterResult> => {
  await gatewayIsolateModulesAsync({
    fn: async () => {
      for (const mock of mocks) {
        gatewayDoMock({ moduleName: mock.module, factory: mock.factory });
      }

      await import(filePathContract.parse(entrypoint));
    },
  });

  return { success: true as const };
};
