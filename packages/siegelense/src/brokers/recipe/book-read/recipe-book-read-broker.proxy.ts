import { fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { locationsRecipesPackagePathFindBrokerProxy } from '../../locations/recipes-package-path-find/locations-recipes-package-path-find-broker.proxy';

const REPO_ROOT = '/repo';
const PACKAGE_PATH = '/repo/packages/siegelense-recipes';

export const recipeBookReadBrokerProxy = (): {
  setupPackagePresent: () => void;
  setupPackagePresentAt: (params: { packagePath: string }) => void;
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

    // Stages ONLY the existence check, against a path the caller already knows the real cwd and
    // path-join resolution produce. Reach for this over `setupPackagePresent` whenever a PARENT
    // proxy is also staging `process.cwd` or `path.join` — those two stagings are one-shots, and a
    // second proxy claiming them steals whichever call happens first, which is the collision
    // scrolls/seigelense/HANDOFF.md's findings-log row 12 names.
    setupPackagePresentAt: ({ packagePath }: { packagePath: string }): void => {
      existsProxy.returns({ filePath: FilePathStub({ value: packagePath }), result: true });
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
