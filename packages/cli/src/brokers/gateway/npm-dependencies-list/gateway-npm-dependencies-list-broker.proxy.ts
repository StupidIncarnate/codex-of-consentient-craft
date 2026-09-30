import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { gatewayExistingPackagesListBrokerProxy } from '../existing-packages-list/gateway-existing-packages-list-broker.proxy';

export const gatewayNpmDependenciesListBrokerProxy = (): {
  setupRepo: (params: {
    repoRoot: string;
    rootPackageJson: Record<string, unknown>;
    workspacePackages: readonly { dirName: string; packageJson: Record<string, unknown> }[];
    gatewayPackages: readonly { dirName: string; packageJson: Record<string, unknown> }[];
  }) => void;
} => {
  const packagesListProxy = gatewayExistingPackagesListBrokerProxy();
  const fileProxy = readFileProxy();

  return {
    setupRepo: ({ repoRoot, rootPackageJson, workspacePackages, gatewayPackages }): void => {
      const packagesDir = `${repoRoot}/packages`;
      const gatewayDir = `${packagesDir}/@gateway`;

      packagesListProxy.setupPackages({
        packagesDir,
        packages: [
          ...workspacePackages.map(({ dirName }) => ({ name: dirName, hasPackageJson: true })),
          ...(gatewayPackages.length > 0 ? [{ name: '@gateway', hasPackageJson: false }] : []),
        ],
      });
      if (gatewayPackages.length > 0) {
        packagesListProxy.setupPackages({
          packagesDir: gatewayDir,
          packages: gatewayPackages.map(({ dirName }) => ({ name: dirName, hasPackageJson: true })),
        });
      } else {
        packagesListProxy.setupNoPackagesDir({ packagesDir: gatewayDir });
      }

      fileProxy.returns({
        path: `${repoRoot}/package.json`,
        contents: JSON.stringify(rootPackageJson),
      });
      for (const { dirName, packageJson } of workspacePackages) {
        fileProxy.returns({
          path: `${packagesDir}/${dirName}/package.json`,
          contents: JSON.stringify(packageJson),
        });
      }
      for (const { dirName, packageJson } of gatewayPackages) {
        fileProxy.returns({
          path: `${gatewayDir}/${dirName}/package.json`,
          contents: JSON.stringify(packageJson),
        });
      }
    },
  };
};
