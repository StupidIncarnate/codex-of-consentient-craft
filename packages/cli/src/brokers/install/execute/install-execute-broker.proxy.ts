import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';

export const installExecuteBrokerProxy = (): {
  setupImport: (params: { installPath: string; module: unknown }) => void;
  setupImportFailure: (params: { installPath: string; error: Error }) => void;
} => {
  const importProxy = dynamicImportProxy();

  return {
    // Keyed on installPath — the module specifier the broker actually calls dynamicImport with.
    setupImport: ({ installPath, module }: { installPath: string; module: unknown }): void => {
      importProxy.returns({ path: installPath, module });
    },
    setupImportFailure: ({ installPath, error }: { installPath: string; error: Error }): void => {
      importProxy.rejects({ path: installPath, error });
    },
  };
};
