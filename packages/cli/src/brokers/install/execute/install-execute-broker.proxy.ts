import { dynamicImport } from '#gateway/node/module';
import { dynamicImportProxy } from '#gateway/node/module/dynamic-import/dynamic-import.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const installExecuteBrokerProxy = (): {
  setupImport: (params: { installPath: FilePath; module: unknown }) => void;
  setupImportFailure: (params: { installPath: FilePath; error: Error }) => void;
} => {
  // dynamicImportProxy() offers no staging of its own (a language primitive, meant to be driven
  // for real) — the phantom call satisfies enforce-proxy-child-creation, and the real staging
  // below addresses the #gateway/node/module dynamicImport itself directly, keyed on the
  // module specifier.
  dynamicImportProxy();
  const importHandle = registerMock({ fn: dynamicImport });

  return {
    // Keyed on installPath — the module specifier the broker actually calls dynamicImport with.
    setupImport: ({ installPath, module }: { installPath: FilePath; module: unknown }): void => {
      importHandle.calledWith([{ path: installPath }]).resolves(module);
    },
    setupImportFailure: ({ installPath, error }: { installPath: FilePath; error: Error }): void => {
      importHandle.calledWith([{ path: installPath }]).rejects(error);
    },
  };
};
