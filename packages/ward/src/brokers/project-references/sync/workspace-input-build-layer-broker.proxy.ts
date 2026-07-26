import { filePathContract } from '@dungeonmaster/shared/contracts';

import { readPackageJsonSafeLayerBrokerProxy } from './read-package-json-safe-layer-broker.proxy';
import { readTsconfigSafeLayerBrokerProxy } from './read-tsconfig-safe-layer-broker.proxy';

export const workspaceInputBuildLayerBrokerProxy = (): {
  setupWorkspace: (params: {
    folderPath: string;
    tsconfigJson: string | null;
    packageJson: string | null;
  }) => void;
} => {
  const tsconfigProxy = readTsconfigSafeLayerBrokerProxy();
  const pkgProxy = readPackageJsonSafeLayerBrokerProxy();

  return {
    setupWorkspace: ({
      folderPath,
      tsconfigJson,
      packageJson,
    }: {
      folderPath: string;
      tsconfigJson: string | null;
      packageJson: string | null;
    }): void => {
      const tsconfigPath = filePathContract.parse(`${folderPath}/tsconfig.json`);
      const pkgJsonPath = filePathContract.parse(`${folderPath}/package.json`);

      if (tsconfigJson === null) {
        tsconfigProxy.throws({ tsconfigPath, error: new Error('ENOENT') });
      } else {
        tsconfigProxy.returns({ tsconfigPath, content: tsconfigJson });
      }

      if (packageJson === null) {
        pkgProxy.throws({ pkgJsonPath, error: new Error('ENOENT') });
      } else {
        pkgProxy.returns({ pkgJsonPath, content: packageJson });
      }
    },
  };
};
