/**
 * PURPOSE: Test proxy for install run broker
 *
 * USAGE:
 * const proxy = installRunBrokerProxy();
 * proxy.setupPackagesAndResults({ packages, results });
 */

import type { FilePath, FileName } from '@dungeonmaster/shared/contracts';

import { packageDiscoverBrokerProxy } from '../../package/discover/package-discover-broker.proxy';
import { installOrchestrateBrokerProxy } from '../orchestrate/install-orchestrate-broker.proxy';

export const installRunBrokerProxy = (): {
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
  setupImport: (params: { installPath: FilePath; module: unknown }) => void;
} => {
  const packageDiscoverProxy = packageDiscoverBrokerProxy();
  const installOrchestratProxy = installOrchestrateBrokerProxy();

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
      packageDiscoverProxy.setupPackageDiscovery(params);
    },
    setupEmptyPackagesDirectory: ({ packagesPath }: { packagesPath: FilePath }): void => {
      packageDiscoverProxy.setupEmptyPackagesDirectory({ packagesPath });
    },
    // Keyed on installPath — the discovered package's own start-install.js path. Callers with
    // more than one discovered package call this once per package's installPath.
    setupImport: ({ installPath, module }: { installPath: FilePath; module: unknown }): void => {
      installOrchestratProxy.setupImport({ installPath, module });
    },
  };
};
