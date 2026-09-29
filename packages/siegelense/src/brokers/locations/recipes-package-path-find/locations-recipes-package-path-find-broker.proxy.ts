import { join } from '#gateway/node/path';
import { cwd } from '#gateway/node/process';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { recipeLocationStatics } from '../../../statics/recipe-location/recipe-location-statics';

export const locationsRecipesPackagePathFindBrokerProxy = (): {
  setupRepoRootAtCwd: (params: { cwdPath: string; packagePath: FilePath }) => void;
  setupRepoRootInParent: (params: {
    cwdPath: string;
    repoRoot: string;
    packagePath: FilePath;
  }) => void;
} => {
  // #gateway/node/process/cwd/cwd.proxy has nothing to stage (a real read with nothing to fake),
  // but enforce-proxy-child-creation still requires composing it since the broker imports `cwd`.
  cwdProxy();
  const cwdHandle = registerMock({ fn: cwd });
  const resolveProxy = cwdResolveBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports.
  const joinHandle = registerMock({ fn: join });

  return {
    setupRepoRootAtCwd: ({
      cwdPath,
      packagePath,
    }: {
      cwdPath: string;
      packagePath: FilePath;
    }): void => {
      cwdHandle.calledWith([]).returns(cwdPath);
      resolveProxy.setupRepoRootFoundAtStart({ startPath: cwdPath });
      joinHandle
        .calledWith([cwdPath, ...recipeLocationStatics.packageDir.segments])
        .returns(packagePath);
    },

    setupRepoRootInParent: ({
      cwdPath,
      repoRoot,
      packagePath,
    }: {
      cwdPath: string;
      repoRoot: string;
      packagePath: FilePath;
    }): void => {
      cwdHandle.calledWith([]).returns(cwdPath);
      resolveProxy.setupRepoRootFoundInParent({ startPath: cwdPath, repoRoot });
      joinHandle
        .calledWith([repoRoot, ...recipeLocationStatics.packageDir.segments])
        .returns(packagePath);
    },
  };
};
