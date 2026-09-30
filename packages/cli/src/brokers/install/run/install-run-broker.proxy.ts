/**
 * PURPOSE: Test proxy for install run broker
 *
 * USAGE:
 * const proxy = installRunBrokerProxy();
 * proxy.setupPackagesAndResults({ packages, results });
 */

import { packageDiscoverBrokerProxy } from '../../package/discover/package-discover-broker.proxy';
import { installFinalizeOrchestrateBrokerProxy } from '../finalize-orchestrate/install-finalize-orchestrate-broker.proxy';
import { installOrchestrateBrokerProxy } from '../orchestrate/install-orchestrate-broker.proxy';

export const installRunBrokerProxy = (): {
  setupPackageDiscovery: (params: {
    packagesPath: string;
    packages: {
      name: string;
      standardPath: string;
      alternatePath?: string;
      installerLocation: 'standard' | 'alternate' | 'none';
      hasFinalize?: boolean;
    }[];
  }) => void;
  setupEmptyPackagesDirectory: (params: { packagesPath: string }) => void;
  setupImport: (params: { installPath: string; module: unknown }) => void;
  setupFinalizeImport: (params: { finalizeInstallPath: string; module: unknown }) => void;
} => {
  const packageDiscoverProxy = packageDiscoverBrokerProxy();
  const installOrchestratProxy = installOrchestrateBrokerProxy();
  const installFinalizeOrchestrateProxy = installFinalizeOrchestrateBrokerProxy();

  return {
    setupPackageDiscovery: (params: {
      packagesPath: string;
      packages: {
        name: string;
        standardPath: string;
        alternatePath?: string;
        installerLocation: 'standard' | 'alternate' | 'none';
        hasFinalize?: boolean;
      }[];
    }): void => {
      packageDiscoverProxy.setupPackageDiscovery(params);
    },
    setupEmptyPackagesDirectory: ({ packagesPath }: { packagesPath: string }): void => {
      packageDiscoverProxy.setupEmptyPackagesDirectory({ packagesPath });
    },
    // Keyed on installPath — the discovered package's own start-install.js path. Callers with
    // more than one discovered package call this once per package's installPath.
    setupImport: ({ installPath, module }: { installPath: string; module: unknown }): void => {
      installOrchestratProxy.setupImport({ installPath, module });
    },
    // Keyed on finalizeInstallPath — the discovered package's own start-install-finalize.js path,
    // staged separately from setupImport above since installFinalizeOrchestrateBroker resolves it
    // through a different call to the shared runtimeDynamicImportAdapter mock.
    setupFinalizeImport: ({
      finalizeInstallPath,
      module,
    }: {
      finalizeInstallPath: string;
      module: unknown;
    }): void => {
      installFinalizeOrchestrateProxy.setupImport({ finalizeInstallPath, module });
    },
  };
};
