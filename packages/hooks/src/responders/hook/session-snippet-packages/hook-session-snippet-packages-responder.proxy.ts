/**
 * PURPOSE: Test proxy for HookSessionSnippetPackagesResponder that mocks the project map broker
 * and the packages-directory readdir the responder uses to enumerate package names.
 *
 * USAGE:
 * const proxy = HookSessionSnippetPackagesResponderProxy();
 * proxy.setupPackages({ packages: [{ name: 'cli' }] });
 * const result = await HookSessionSnippetPackagesResponder({ projectRoot });
 */

import type { Dirent } from 'fs';
import {
  architectureProjectMapBrokerProxy,
  fsReaddirWithTypesAdapterProxy,
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';

const makeDirent = ({ name, isDir }: { name: string; isDir: boolean }): Dirent =>
  ({
    name,
    parentPath: '/stub',
    path: '/stub',
    isDirectory: () => isDir,
    isFile: () => !isDir,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
  }) as Dirent;

export const HookSessionSnippetPackagesResponderProxy = (): {
  setupPackages: (params: { packages: { name: string }[] }) => void;
  setupEmptyMonorepo: () => void;
} => {
  processCwdAdapterProxy();
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  const projectMapProxy = architectureProjectMapBrokerProxy();

  return {
    setupPackages: ({ packages }: { packages: { name: string }[] }): void => {
      readdirProxy.returns({
        entries: packages.map((pkg) => makeDirent({ name: pkg.name, isDir: true })),
      });
      for (const pkg of packages) {
        projectMapProxy.setupRenderablePackage({ packageName: pkg.name });
      }
    },

    setupEmptyMonorepo: (): void => {
      // The hooks snippet expects a `# root [type]` header even in single-root mode.
      // Make the responder's readdir throw so it falls back to the literal 'root' name,
      // and configure the project-map broker to render that root as a renderable package.
      readdirProxy.throws({ error: new Error('ENOENT: no packages dir') });
      projectMapProxy.setupRenderablePackage({ packageName: 'root' });
    },
  };
};
