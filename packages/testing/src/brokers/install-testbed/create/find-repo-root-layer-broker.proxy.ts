/**
 * PURPOSE: Proxy for findRepoRootLayerBroker
 *
 * USAGE:
 * const proxy = findRepoRootLayerBrokerProxy();
 * proxy.setupWorkspacesRootAt({ dirPath: '/fake/repo' });
 * proxy.setupPlainPackageAt({ dirPath: '/fake/repo/packages/sub' });
 * // Constructor also stages a default workspaces root at this proxy's own __dirname, so any
 * // composing broker's proxy (installTestbedCreateBrokerProxy) resolves without further setup.
 */

import { join } from 'path';
import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { pathDirnameAdapterProxy } from '../../../adapters/path/dirname/path-dirname-adapter.proxy';
import { FileContentStub } from '../../../contracts/file-content/file-content.stub';

export const findRepoRootLayerBrokerProxy = (): {
  setupWorkspacesRootAt: ({ dirPath }: { dirPath: string }) => void;
  setupPlainPackageAt: ({ dirPath }: { dirPath: string }) => void;
} => {
  const existsProxy = fsExistsAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  pathJoinAdapterProxy();
  pathDirnameAdapterProxy();

  // Catch-all: installTestbedCreateBrokerProxy composes this proxy without describing its own
  // walk, so this proxy's own __dirname (the same directory findRepoRootLayerBroker's real
  // caller starts from) defaults to a synthetic workspaces root. That resolves the walk on the
  // first check instead of climbing to the filesystem root and throwing.
  const defaultPackageJsonPath = join(__dirname, 'package.json');
  existsProxy.returns({ filePath: defaultPackageJsonPath, exists: true });
  readFileProxy.returns({
    filePath: defaultPackageJsonPath,
    content: FileContentStub({ value: JSON.stringify({ workspaces: ['packages/*'] }) }),
  });

  return {
    setupWorkspacesRootAt: ({ dirPath }: { dirPath: string }): void => {
      const packageJsonPath = join(dirPath, 'package.json');
      existsProxy.returns({ filePath: packageJsonPath, exists: true });
      readFileProxy.returns({
        filePath: packageJsonPath,
        content: FileContentStub({ value: JSON.stringify({ workspaces: ['packages/*'] }) }),
      });
    },
    setupPlainPackageAt: ({ dirPath }: { dirPath: string }): void => {
      const packageJsonPath = join(dirPath, 'package.json');
      existsProxy.returns({ filePath: packageJsonPath, exists: true });
      readFileProxy.returns({
        filePath: packageJsonPath,
        content: FileContentStub({ value: JSON.stringify({ name: 'sub-package' }) }),
      });
    },
  };
};
