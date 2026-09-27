import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsNodeModulesPathFindBrokerProxy = (): {
  setupNodeModulesPath: (params: { nodeModulesPath: FilePath }) => void;
} => {
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. rootPath is recovered by slicing the known 'node_modules'
  // suffix off nodeModulesPath, so join() is staged on the EXACT tuple the broker really passes.
  const joinHandle = registerMock({ fn: join });

  return {
    setupNodeModulesPath: ({ nodeModulesPath }: { nodeModulesPath: FilePath }): void => {
      const suffix = `/${locationsStatics.repoRoot.nodeModules}`;
      const rootPath = nodeModulesPath.slice(0, nodeModulesPath.length - suffix.length);
      joinHandle
        .calledWith([rootPath, locationsStatics.repoRoot.nodeModules])
        .returns(nodeModulesPath);
    },
  };
};
