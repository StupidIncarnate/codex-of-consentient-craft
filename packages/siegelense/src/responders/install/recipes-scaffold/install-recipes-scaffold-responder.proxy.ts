import {
  fsExistsSyncAdapterProxy,
  fsMkdirAdapterProxy,
  pathResolveAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { InstallRecipesScaffoldResponder } from './install-recipes-scaffold-responder';

// Every caller in these tests exercises targetProjectRoot: '/project' (the real, unstaged
// pathResolve passthrough resolves it to these exact paths), so every test lands on these paths.
const RECIPES_PACKAGE_PATH = FilePathStub({ value: '/project/packages/siegelense-recipes' });
const RECIPES_SRC_PATH = FilePathStub({ value: '/project/packages/siegelense-recipes/src' });

export const InstallRecipesScaffoldResponderProxy = (): {
  callResponder: typeof InstallRecipesScaffoldResponder;
  setupPackageAbsent: () => void;
  setupPackagePresent: () => void;
  getCreatedDirs: () => readonly unknown[];
} => {
  pathResolveAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();

  return {
    callResponder: InstallRecipesScaffoldResponder,

    // Neither packages/siegelense-recipes/ nor its src/ exist yet — the fresh-install case.
    setupPackageAbsent: (): void => {
      existsProxy.returns({ filePath: RECIPES_PACKAGE_PATH, result: false });
      mkdirProxy.succeeds({ filepath: RECIPES_SRC_PATH });
    },

    // The package already exists — real or seeded by a prior install. Nothing under it is read
    // or written, so no mkdir staging is needed: an attempted call fails the test on its own.
    setupPackagePresent: (): void => {
      existsProxy.returns({ filePath: RECIPES_PACKAGE_PATH, result: true });
    },

    getCreatedDirs: (): readonly unknown[] => mkdirProxy.getCreatedDirs(),
  };
};
