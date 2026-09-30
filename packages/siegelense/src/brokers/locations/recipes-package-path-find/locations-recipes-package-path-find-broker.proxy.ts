import { join } from '#gateway/node/path';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';

import { recipeLocationStatics } from '../../../statics/recipe-location/recipe-location-statics';

export const locationsRecipesPackagePathFindBrokerProxy = (): {
  setupRepoRootAtCwd: (params: { cwdPath: string; packagePath: string }) => void;
  setupRepoRootInParent: (params: {
    cwdPath: string;
    repoRoot: string;
    packagePath: string;
  }) => void;
} => {
  const cwdStage = cwdProxy();
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
      packagePath: string;
    }): void => {
      cwdStage.setupCwd({ value: cwdPath });
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
      packagePath: string;
    }): void => {
      cwdStage.setupCwd({ value: cwdPath });
      resolveProxy.setupRepoRootFoundInParent({ startPath: cwdPath, repoRoot });
      joinHandle
        .calledWith([repoRoot, ...recipeLocationStatics.packageDir.segments])
        .returns(packagePath);
    },
  };
};
