import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsNodeModulesBinPathFindBrokerProxy = (): {
  setupBinPath: (params: { binPath: FilePath }) => void;
} => {
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. rootPath and binName are recovered by splitting binPath on the
  // known 'node_modules/.bin' segment, so join() is staged on the EXACT tuple the broker passes —
  // never an address-less catch-all.
  const joinHandle = registerMock({ fn: join });

  return {
    setupBinPath: ({ binPath }: { binPath: FilePath }): void => {
      const marker = `/${locationsStatics.repoRoot.nodeModulesBin}/`;
      const markerIndex = binPath.indexOf(marker);
      const rootPath = binPath.slice(0, markerIndex);
      const binName = binPath.slice(markerIndex + marker.length);
      joinHandle
        .calledWith([rootPath, locationsStatics.repoRoot.nodeModulesBin, binName])
        .returns(binPath);
    },
  };
};
