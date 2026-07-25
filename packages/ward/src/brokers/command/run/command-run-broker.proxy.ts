import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { workspaceDiscoverBrokerProxy } from '../../workspace/discover/workspace-discover-broker.proxy';
import { gitDiffFilesBrokerProxy } from '../../git/diff-files/git-diff-files-broker.proxy';
import { projectReferencesSyncBrokerProxy } from '../../project-references/sync/project-references-sync-broker.proxy';
import { checkRunTypecheckRefsBrokerProxy } from '../../check-run/typecheck-refs/check-run-typecheck-refs-broker.proxy';
import { commandRunLayerFolderBrokerProxy } from './command-run-layer-folder-broker.proxy';
import { commandRunLayerSingleBrokerProxy } from './command-run-layer-single-broker.proxy';
import { commandRunLayerMultiBrokerProxy } from './command-run-layer-multi-broker.proxy';

// One eslint finding — a genuine red run, as opposed to a check that exits non-zero while
// reporting nothing (the crash shape below).
const LINT_ERROR_REPORT = JSON.stringify([
  {
    filePath: '/project/src/index.ts',
    messages: [
      { ruleId: 'no-explicit-any', severity: 2, message: 'Unexpected any', line: 10, column: 5 },
    ],
  },
]);

export const commandRunBrokerProxy = (): {
  setupSinglePackagePass: () => void;
  setupSinglePackageFail: () => void;
  setupSinglePackageCrash: () => void;
  setupMultiPackagePass: (params: { packageCount: number; subResultContent: string }) => void;
  getStdoutCalls: () => unknown[][];
  getExitCalls: () => unknown[][];
} => {
  const exitSpy = registerSpyOn({ object: process, method: 'exit' });
  exitSpy.mockImplementation(() => undefined as never);
  const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutSpy.mockImplementation(() => true);
  registerSpyOn({ object: process.stderr, method: 'write' }).mockImplementation(() => true);

  const workspaceProxy = workspaceDiscoverBrokerProxy();
  gitDiffFilesBrokerProxy();
  projectReferencesSyncBrokerProxy();
  checkRunTypecheckRefsBrokerProxy();
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
      singleProxy.setupLintOnlyFail({ stdout: LINT_ERROR_REPORT });
    },
    setupSinglePackageCrash: (): void => {
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
    getStdoutCalls: (): unknown[][] => stdoutSpy.mock.calls,
    getExitCalls: (): unknown[][] => exitSpy.mock.calls,
  };
};
