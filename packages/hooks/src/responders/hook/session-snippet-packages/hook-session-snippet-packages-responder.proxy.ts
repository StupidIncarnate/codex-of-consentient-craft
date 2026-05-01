/**
 * PURPOSE: Test proxy for HookSessionSnippetPackagesResponder that mocks the project map broker
 *
 * USAGE:
 * const proxy = HookSessionSnippetPackagesResponderProxy();
 * proxy.setupPackages({ packages: [{ name: 'cli' }] });
 * const result = await HookSessionSnippetPackagesResponder({ projectRoot });
 */

import {
  architectureProjectMapBrokerProxy,
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';

export const HookSessionSnippetPackagesResponderProxy = (): {
  setupPackages: (params: { packages: { name: string }[] }) => void;
  setupEmptyMonorepo: () => void;
} => {
  processCwdAdapterProxy();
  const projectMapProxy = architectureProjectMapBrokerProxy();

  return {
    setupPackages: ({ packages }: { packages: { name: string }[] }): void => {
      for (const pkg of packages) {
        projectMapProxy.setupLibraryPackage({ packageName: pkg.name });
      }
    },

    setupEmptyMonorepo: (): void => {
      projectMapProxy.setupEmptyMonorepo();
    },
  };
};
