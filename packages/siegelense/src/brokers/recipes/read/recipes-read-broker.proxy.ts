import { dynamicImport } from '#gateway/node/module';
import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { recipesLocateBrokerProxy } from '../locate/recipes-locate-broker.proxy';

export const recipesReadBrokerProxy = (): {
  setupModule: (params: { entryPath: FilePath; moduleExports: unknown }) => void;
} => {
  const locateProxy = recipesLocateBrokerProxy();
  // dynamicImportProxy() offers no staging of its own (a language primitive, meant to be driven
  // for real) — the phantom call satisfies enforce-proxy-child-creation, and the real staging
  // below addresses dynamicImport itself directly, keyed on the module specifier.
  dynamicImportProxy();
  const importHandle = registerMock({ fn: dynamicImport });

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
      importHandle.calledWith([{ path: entryPath }]).resolves(moduleExports);
    },
  };
};
