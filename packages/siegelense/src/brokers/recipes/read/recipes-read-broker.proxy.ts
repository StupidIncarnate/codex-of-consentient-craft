import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';

import { recipesLocateBrokerProxy } from '../locate/recipes-locate-broker.proxy';

export const recipesReadBrokerProxy = (): {
  setupModule: (params: { entryPath: string; moduleExports: unknown }) => void;
} => {
  const locateProxy = recipesLocateBrokerProxy();
  const importProxy = dynamicImportProxy();

  return {
    setupModule: ({
      entryPath,
      moduleExports,
    }: {
      entryPath: string;
      moduleExports: unknown;
    }): void => {
      locateProxy.setupPresentAndBuilt({
        cwdPath: '/repo',
        packagePath: '/repo/packages/hydration-recipes',
        entryPath,
      });
      importProxy.returns({ path: entryPath, module: moduleExports });
    },
  };
};
