/**
 * PURPOSE: Test proxy for useInstallBinding - delegates to broker proxy
 *
 * USAGE:
 * const proxy = useInstallBindingProxy();
 * proxy.setupInstallSuccess({ results });
 */
import type { FilePath, FileName } from '@dungeonmaster/shared/contracts';

import { installRunBrokerProxy } from '../../brokers/install/run/install-run-broker.proxy';

export const useInstallBindingProxy = (): {
  setupPackageDiscovery: (params: {
    packagesPath: FilePath;
    packages: {
      name: FileName;
      standardPath: FilePath;
      alternatePath?: FilePath;
      installerLocation: 'standard' | 'alternate' | 'none';
    }[];
  }) => void;
  setupEmptyPackagesDirectory: (params: { packagesPath: FilePath }) => void;
  setupImport: (params: { module: unknown }) => void;
} => {
  const installRunProxy = installRunBrokerProxy();

  return {
    setupPackageDiscovery: (params: {
      packagesPath: FilePath;
      packages: {
        name: FileName;
        standardPath: FilePath;
        alternatePath?: FilePath;
        installerLocation: 'standard' | 'alternate' | 'none';
      }[];
    }): void => {
      installRunProxy.setupPackageDiscovery(params);
    },
    setupEmptyPackagesDirectory: ({ packagesPath }: { packagesPath: FilePath }): void => {
      installRunProxy.setupEmptyPackagesDirectory({ packagesPath });
    },
    setupImport: ({ module }: { module: unknown }): void => {
      installRunProxy.setupImport({ module });
    },
  };
};
