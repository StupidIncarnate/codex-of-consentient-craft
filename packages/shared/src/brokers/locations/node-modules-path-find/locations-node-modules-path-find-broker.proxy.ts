import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const locationsNodeModulesPathFindBrokerProxy = (): {
  setupNodeModulesPath: (params: { nodeModulesPath: string }) => void;
} => {
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. rootPath is recovered by slicing the known 'node_modules'
  // suffix off nodeModulesPath, so join() is staged on the EXACT tuple the broker really passes.
  const joinHandle = registerMock({ fn: join });
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  // Sticky real-passthrough default for every OTHER join() call this test never describes —
  // join(rootPath, 'node_modules') is pure string arithmetic with nothing to fake.
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  return {
    setupNodeModulesPath: ({ nodeModulesPath }: { nodeModulesPath: string }): void => {
      const suffix = `/${locationsStatics.repoRoot.nodeModules}`;
      const rootPath = nodeModulesPath.slice(0, nodeModulesPath.length - suffix.length);
      joinHandle
        .calledWith([rootPath, locationsStatics.repoRoot.nodeModules])
        .returns(nodeModulesPath);
    },
  };
};
