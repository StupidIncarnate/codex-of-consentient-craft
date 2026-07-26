import { runtimeDynamicImportAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const installExecuteBrokerProxy = (): {
  setupImport: (params: { installPath: FilePath; module: unknown }) => void;
  setupImportFailure: (params: { installPath: FilePath; error: Error }) => void;
} => {
  const importProxy = runtimeDynamicImportAdapterProxy();

  return {
    // Keyed on installPath — the module specifier the broker actually calls
    // runtimeDynamicImportAdapter with.
    setupImport: ({ installPath, module }: { installPath: FilePath; module: unknown }): void => {
      importProxy.succeeds({ path: installPath, module });
    },
    setupImportFailure: ({ installPath, error }: { installPath: FilePath; error: Error }): void => {
      importProxy.throws({ path: installPath, error });
    },
  };
};
