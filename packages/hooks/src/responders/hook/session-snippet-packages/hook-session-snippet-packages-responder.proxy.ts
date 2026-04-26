/**
 * PURPOSE: Test proxy for HookSessionSnippetPackagesResponder that mocks the project map broker
 *
 * USAGE:
 * const proxy = HookSessionSnippetPackagesResponderProxy();
 * proxy.setupPackages({ packages: [{ name: 'cli', description: ContentTextStub({ value: 'CLI' }) }] });
 * const result = HookSessionSnippetPackagesResponder({ projectRoot });
 */

import {
  architectureProjectMapBrokerProxy,
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { ContentTextStub } from '@dungeonmaster/shared/contracts';

export const HookSessionSnippetPackagesResponderProxy = (): {
  setupPackages: (params: {
    packages: {
      name: string;
      description?: ReturnType<typeof ContentTextStub>;
    }[];
  }) => void;
} => {
  processCwdAdapterProxy();
  const projectMapProxy = architectureProjectMapBrokerProxy();

  return {
    setupPackages: ({
      packages,
    }: {
      packages: {
        name: string;
        description?: ReturnType<typeof ContentTextStub>;
      }[];
    }): void => {
      projectMapProxy.setupMonorepo({
        packages: packages.map((pkg) => ({
          ...pkg,
          folders: [],
        })),
      });
    },
  };
};
