import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const installExecuteBrokerProxy = (): {
  setupImport: (params: { installPath: FilePath; module: unknown }) => void;
  setupImportFailure: (params: { installPath: FilePath; error: Error }) => void;
} => {
  const importProxy = dynamicImportProxy();

  return {
    // Keyed on installPath — the module specifier the broker actually calls dynamicImport with.
    setupImport: ({ installPath, module }: { installPath: FilePath; module: unknown }): void => {
      importProxy.returns({ path: installPath, module });
    },
    setupImportFailure: ({ installPath, error }: { installPath: FilePath; error: Error }): void => {
      importProxy.rejects({ path: installPath, error });
    },
  };
};
