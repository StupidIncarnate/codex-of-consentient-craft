import { workspaceDiscoverBrokerProxy } from '../../workspace/discover/workspace-discover-broker.proxy';
import { commandRunLayerFolderBrokerProxy } from './command-run-layer-folder-broker.proxy';
import { commandRunLayerSingleBrokerProxy } from './command-run-layer-single-broker.proxy';
import { commandRunLayerMultiBrokerProxy } from './command-run-layer-multi-broker.proxy';

export const commandRunBrokerProxy = (): {
  setupSinglePackagePass: () => void;
  setupMultiPackagePass: (params: { packageCount: number; subResultContent: string }) => void;
} => {
  jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
  jest.spyOn(process.stderr, 'write').mockImplementation(() => true);

  const workspaceProxy = workspaceDiscoverBrokerProxy();
  const folderProxy = commandRunLayerFolderBrokerProxy();
  const singleProxy = commandRunLayerSingleBrokerProxy();
  const multiProxy = commandRunLayerMultiBrokerProxy();

  return {
    setupSinglePackagePass: (): void => {
      workspaceProxy.setupSinglePackage();
      folderProxy.setupReturnsPackage({ name: 'test-pkg' });
      singleProxy.setupAllChecksPass();
    },
    setupMultiPackagePass: ({
      packageCount,
      subResultContent,
    }: {
      packageCount: number;
      subResultContent: string;
    }): void => {
      multiProxy.setupSpawnAndLoad({ packageCount, subResultContent });
    },
  };
};
