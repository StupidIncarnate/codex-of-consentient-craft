/**
 * PURPOSE: Proxy for InitScreenLayerWidget - minimal since real ink-testing-library is used
 *
 * USAGE:
 * const proxy = InitScreenLayerWidgetProxy();
 * proxy.setupEmptyPackagesDirectory({ packagesPath });
 * const { lastFrame, stdin } = render(<InitScreenLayerWidget onBack={onBack} />);
 * stdin.write('\x1B'); // Escape
 *
 * This proxy exists for API compatibility. With real ink-testing-library,
 * use stdin.write() for key simulation instead of proxy trigger methods.
 */

import type { FilePath, FileName } from '@dungeonmaster/shared/contracts';

import { inkBoxAdapterProxy } from '../../adapters/ink/box/ink-box-adapter.proxy';
import { inkTextAdapterProxy } from '../../adapters/ink/text/ink-text-adapter.proxy';
import { inkUseInputAdapterProxy } from '../../adapters/ink/use-input/ink-use-input-adapter.proxy';
import { useInstallBindingProxy } from '../../bindings/use-install/use-install-binding.proxy';

export const InitScreenLayerWidgetProxy = (): {
  triggerEscape: () => void;
  triggerKeyQ: () => void;
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
  // Initialize child proxies for dependencies (now no-ops with real ink)
  inkBoxAdapterProxy();
  inkTextAdapterProxy();
  inkUseInputAdapterProxy();
  const installBindingProxy = useInstallBindingProxy();

  // With real ink-testing-library, use stdin.write() instead of these triggers
  // These methods are kept for API compatibility but are no longer needed
  return {
    triggerEscape: (): void => {
      // Use stdin.write('\x1B') instead with real ink-testing-library
    },
    triggerKeyQ: (): void => {
      // Use stdin.write('q') instead with real ink-testing-library
    },
    setupPackageDiscovery: (params: {
      packagesPath: FilePath;
      packages: {
        name: FileName;
        standardPath: FilePath;
        alternatePath?: FilePath;
        installerLocation: 'standard' | 'alternate' | 'none';
      }[];
    }): void => {
      installBindingProxy.setupPackageDiscovery(params);
    },
    setupEmptyPackagesDirectory: ({ packagesPath }: { packagesPath: FilePath }): void => {
      installBindingProxy.setupEmptyPackagesDirectory({ packagesPath });
    },
    setupImport: ({ module }: { module: unknown }): void => {
      installBindingProxy.setupImport({ module });
    },
  };
};
