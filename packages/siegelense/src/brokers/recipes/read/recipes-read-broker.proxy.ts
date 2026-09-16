import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { runtimeDynamicImportAdapterProxy } from '@dungeonmaster/shared/testing';

import { recipesLocateBrokerProxy } from '../locate/recipes-locate-broker.proxy';

export const recipesReadBrokerProxy = (): {
  setupModule: (params: { entryPath: FilePath; moduleExports: unknown }) => void;
} => {
  const locateProxy = recipesLocateBrokerProxy();
  const importProxy = runtimeDynamicImportAdapterProxy();

  return {
    setupModule: ({
      entryPath,
      moduleExports,
    }: {
      entryPath: FilePath;
      moduleExports: unknown;
    }): void => {
      locateProxy.setupPresentAndBuilt({
        cwdPath: '/repo',
        packagePath: FilePathStub({ value: '/repo/packages/siegelense-recipes' }),
        entryPath,
      });
      importProxy.succeeds({ path: entryPath, module: moduleExports });
    },
  };
};
