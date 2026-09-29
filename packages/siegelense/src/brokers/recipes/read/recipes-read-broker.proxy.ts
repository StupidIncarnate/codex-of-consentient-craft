import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';

import { recipesLocateBrokerProxy } from '../locate/recipes-locate-broker.proxy';

export const recipesReadBrokerProxy = (): {
  setupModule: (params: { entryPath: FilePath; moduleExports: unknown }) => void;
} => {
  const locateProxy = recipesLocateBrokerProxy();
  const importProxy = dynamicImportProxy();

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
        packagePath: FilePathStub({ value: '/repo/packages/hydration-recipes' }),
        entryPath,
      });
      importProxy.returns({ path: entryPath, module: moduleExports });
    },
  };
};
