/**
 * PURPOSE: Proxy for workspacePackageJsonReadMiddleware — stages a package.json's existence and
 * raw JSON content, addressed by its path.
 *
 * USAGE:
 * const proxy = workspacePackageJsonReadMiddlewareProxy();
 * proxy.setupPackageJsonAt({ packageJsonPath: '/repo/packages/bin/package.json', packageJson: {...} });
 * proxy.setupMissingAt({ packageJsonPath: '/repo/packages/ghost/package.json' });
 */

import { fsExistsAdapterProxy } from '../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { FileContentStub } from '../../contracts/file-content/file-content.stub';

export const workspacePackageJsonReadMiddlewareProxy = (): {
  setupPackageJsonAt: ({
    packageJsonPath,
    packageJson,
  }: {
    packageJsonPath: string;
    packageJson: Record<PropertyKey, unknown>;
  }) => void;
  setupMissingAt: ({ packageJsonPath }: { packageJsonPath: string }) => void;
} => {
  const existsProxy = fsExistsAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupPackageJsonAt: ({
      packageJsonPath,
      packageJson,
    }: {
      packageJsonPath: string;
      packageJson: Record<PropertyKey, unknown>;
    }): void => {
      existsProxy.returns({ filePath: packageJsonPath, exists: true });
      readFileProxy.returns({
        filePath: packageJsonPath,
        content: FileContentStub({ value: JSON.stringify(packageJson) }),
      });
    },
    setupMissingAt: ({ packageJsonPath }: { packageJsonPath: string }): void => {
      existsProxy.returns({ filePath: packageJsonPath, exists: false });
    },
  };
};
