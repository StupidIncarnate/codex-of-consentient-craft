import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { workspaceDiscoverBrokerProxy } from '../../workspace/discover/workspace-discover-broker.proxy';
import { gitDiffFilesBrokerProxy } from '../../git/diff-files/git-diff-files-broker.proxy';
import { commandRunLayerFolderBrokerProxy } from './command-run-layer-folder-broker.proxy';
import { commandRunLayerSingleBrokerProxy } from './command-run-layer-single-broker.proxy';
import { commandRunLayerMultiBrokerProxy } from './command-run-layer-multi-broker.proxy';

export const commandRunBrokerProxy = (): {
  setupSinglePackagePass: () => void;
  setupSinglePackageFail: () => void;
  setupMultiPackagePass: (params: { packageCount: number; subResultContent: string }) => void;
} => {
  registerSpyOn({ object: process, method: 'exit' }).mockImplementation(() => undefined as never);
  registerSpyOn({ object: process.stdout, method: 'write' }).mockImplementation(() => true);
  registerSpyOn({ object: process.stderr, method: 'write' }).mockImplementation(() => true);

  const workspaceProxy = workspaceDiscoverBrokerProxy();
  gitDiffFilesBrokerProxy();
  const folderProxy = commandRunLayerFolderBrokerProxy();
  const singleProxy = commandRunLayerSingleBrokerProxy();
  const multiProxy = commandRunLayerMultiBrokerProxy();

  return {
    setupSinglePackagePass: (): void => {
      workspaceProxy.setupSinglePackage();
      folderProxy.setupReturnsPackage({ name: 'test-pkg' });
      singleProxy.setupAllChecksPass();
    },
    setupSinglePackageFail: (): void => {
      workspaceProxy.setupSinglePackage();
      folderProxy.setupReturnsPackage({ name: 'test-pkg' });
      singleProxy.setupLintOnlyFail({ stdout: '[]' });
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
