import type { FilePath } from '@dungeonmaster/shared/contracts';

import { installExecuteBrokerProxy } from '../execute/install-execute-broker.proxy';

export const installFinalizeOrchestrateBrokerProxy = (): {
  setupImport: (params: { finalizeInstallPath: FilePath; module: unknown }) => void;
} => {
  const installExecuteProxy = installExecuteBrokerProxy();

  return {
    // Keyed on finalizeInstallPath — the broker calls installExecuteBroker once per package with
    // that package's own finalizeInstallPath (as installExecuteBroker's installPath argument), so
    // each package the caller cares about needs its own call.
    setupImport: ({
      finalizeInstallPath,
      module,
    }: {
      finalizeInstallPath: FilePath;
      module: unknown;
    }): void => {
      installExecuteProxy.setupImport({ installPath: finalizeInstallPath, module });
    },
  };
};
