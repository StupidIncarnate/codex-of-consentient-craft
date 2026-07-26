/**
 * PURPOSE: Test proxy for HookSessionSnippetPackagesResponder that mocks the project map broker
 * and the packages-directory readdir the responder uses to enumerate package names.
 *
 * USAGE:
 * const proxy = HookSessionSnippetPackagesResponderProxy();
 * proxy.setupPackages({ projectRoot, packages: [{ name: 'cli' }] });
 * const result = await HookSessionSnippetPackagesResponder({ projectRoot });
 */

import type { Dirent } from 'fs';
import {
  architectureProjectMapBrokerProxy,
  fsReaddirWithTypesAdapterProxy,
  processCwdAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

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

// The responder builds `${projectRoot}/packages` as the readdir target — mirror that exact join
// here so the mock is keyed on the same dirPath the responder actually reads.
const packagesDirFor = ({ projectRoot }: { projectRoot: AbsoluteFilePath }): AbsoluteFilePath =>
  AbsoluteFilePathStub({ value: `${String(projectRoot)}/packages` });

export const HookSessionSnippetPackagesResponderProxy = (): {
  setupPackages: (params: { projectRoot: AbsoluteFilePath; packages: { name: string }[] }) => void;
  setupEmptyMonorepo: (params: { projectRoot: AbsoluteFilePath }) => void;
} => {
  processCwdAdapterProxy();
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  const projectMapProxy = architectureProjectMapBrokerProxy();

  return {
    setupPackages: ({
      projectRoot,
      packages,
    }: {
      projectRoot: AbsoluteFilePath;
      packages: { name: string }[];
    }): void => {
      readdirProxy.returns({
        dirPath: packagesDirFor({ projectRoot }),
        entries: packages.map((pkg) => makeDirent({ name: pkg.name, isDir: true })),
      });
      for (const pkg of packages) {
        projectMapProxy.setupRenderablePackage({ projectRoot, packageName: pkg.name });
      }
    },

    setupEmptyMonorepo: ({ projectRoot }: { projectRoot: AbsoluteFilePath }): void => {
      // The hooks snippet expects a `# root [type]` header even in single-root mode.
      // Make the responder's readdir throw so it falls back to the literal 'root' name,
      // and configure the project-map broker to render that root as a renderable package.
      readdirProxy.throws({
        dirPath: packagesDirFor({ projectRoot }),
        error: new Error('ENOENT: no packages dir'),
      });
      projectMapProxy.setupRenderablePackage({ projectRoot, packageName: 'root' });
    },
  };
};
