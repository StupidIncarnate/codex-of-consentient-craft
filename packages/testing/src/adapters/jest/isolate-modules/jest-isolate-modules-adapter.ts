/**
 * PURPOSE: Wraps jest.isolateModules and jest.doMock for entry point testing without direct jest API usage in proxies
 *
 * USAGE:
 * jestIsolateModulesAdapter({ mocks: [{ module: filePathContract.parse('/abs/path/to/module'), factory: () => ({}) }], entrypoint: filePathContract.parse('/abs/path/to/index') });
 * // Loads entrypoint in an isolated module scope with specified modules mocked
 */
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export interface IsolateModulesMock {
  module: FilePath;
  factory: () => Record<PropertyKey, unknown>;
}

export const jestIsolateModulesAdapter = ({
  mocks,
  entrypoint,
}: {
  mocks: IsolateModulesMock[];
  entrypoint: FilePath;
}): void => {
  jest.isolateModules(() => {
    for (const mock of mocks) {
      jest.doMock(mock.module, mock.factory);
    }

    require(filePathContract.parse(entrypoint));
  });
};
