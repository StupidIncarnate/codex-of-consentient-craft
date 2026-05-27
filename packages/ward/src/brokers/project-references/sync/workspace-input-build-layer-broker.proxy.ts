import { readPackageJsonSafeLayerBrokerProxy } from './read-package-json-safe-layer-broker.proxy';
import { readTsconfigSafeLayerBrokerProxy } from './read-tsconfig-safe-layer-broker.proxy';

export const workspaceInputBuildLayerBrokerProxy = (): {
  setupWorkspace: (params: { tsconfigJson: string | null; packageJson: string | null }) => void;
} => {
  const tsconfigProxy = readTsconfigSafeLayerBrokerProxy();
  const pkgProxy = readPackageJsonSafeLayerBrokerProxy();

  return {
    setupWorkspace: ({
      tsconfigJson,
      packageJson,
    }: {
      tsconfigJson: string | null;
      packageJson: string | null;
    }): void => {
      if (tsconfigJson === null) {
        tsconfigProxy.throws({ error: new Error('ENOENT') });
      } else {
        tsconfigProxy.returns({ content: tsconfigJson });
      }

      if (packageJson === null) {
        pkgProxy.throws({ error: new Error('ENOENT') });
      } else {
        pkgProxy.returns({ content: packageJson });
      }
    },
  };
};
