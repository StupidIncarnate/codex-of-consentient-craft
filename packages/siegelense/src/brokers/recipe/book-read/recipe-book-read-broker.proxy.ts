import { fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { locationsRecipesPackagePathFindBrokerProxy } from '../../locations/recipes-package-path-find/locations-recipes-package-path-find-broker.proxy';

const REPO_ROOT = '/repo';
const PACKAGE_PATH = '/repo/packages/siegelense-recipes';

export const recipeBookReadBrokerProxy = (): {
  setupPackagePresent: () => void;
  setupPackageAbsent: () => void;
} => {
  const locationsProxy = locationsRecipesPackagePathFindBrokerProxy();
  const existsProxy = fsExistsSyncAdapterProxy();

  return {
    setupPackagePresent: (): void => {
      locationsProxy.setupRepoRootAtCwd({
        cwdPath: REPO_ROOT,
        packagePath: FilePathStub({ value: PACKAGE_PATH }),
      });
      existsProxy.returns({ filePath: FilePathStub({ value: PACKAGE_PATH }), result: true });
    },

    setupPackageAbsent: (): void => {
      locationsProxy.setupRepoRootAtCwd({
        cwdPath: REPO_ROOT,
        packagePath: FilePathStub({ value: PACKAGE_PATH }),
      });
      existsProxy.returns({ filePath: FilePathStub({ value: PACKAGE_PATH }), result: false });
    },
  };
};
