import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { workspaceDiscoverBrokerProxy } from '../../workspace/discover/workspace-discover-broker.proxy';
import { gitDiffFilesBrokerProxy } from '../../git/diff-files/git-diff-files-broker.proxy';
import { projectReferencesSyncBrokerProxy } from '../../project-references/sync/project-references-sync-broker.proxy';
import { checkRunTypecheckRefsBrokerProxy } from '../../check-run/typecheck-refs/check-run-typecheck-refs-broker.proxy';
import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
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
  getStdoutCalls: () => unknown[];
  getExitCalls: () => RecordedCalls;
} => {
  // process.exit is never actually called by this broker (it sets process.exitCode instead) —
  // the catch-all only guards against an accidental future call, so there is no exit code to key on.
  const exitSpy = registerSpyOn({ object: process, method: 'exit' });
  exitSpy.calledWith([]).returns(undefined);
  // write()'s return value never varies by content in these tests — only what was written matters,
  // and that is read back through callsMatching below, so the catch-all stays unaddressed.
  const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
  stdoutSpy.calledWith([]).returns(true);
  registerSpyOn({ object: process.stderr, method: 'write' }).calledWith([]).returns(true);

  const workspaceProxy = workspaceDiscoverBrokerProxy();
  gitDiffFilesBrokerProxy();
  projectReferencesSyncBrokerProxy();
  checkRunTypecheckRefsBrokerProxy();
  const folderProxy = commandRunLayerFolderBrokerProxy();
  const singleProxy = commandRunLayerSingleBrokerProxy();
  const multiProxy = commandRunLayerMultiBrokerProxy();

  // Matches what commandRunLayerFolderBroker actually returns for rootPath '/project' when
  // folderProxy stages a package.json named 'test-pkg'.
  const singlePackageProjectFolder = ProjectFolderStub({ name: 'test-pkg', path: '/project' });

  return {
    setupSinglePackagePass: (): void => {
      workspaceProxy.setupSinglePackage();
      folderProxy.setupReturnsPackage({ name: 'test-pkg' });
      singleProxy.setupAllChecksPass({ projectFolder: singlePackageProjectFolder });
    },
    setupSinglePackageFail: (): void => {
      workspaceProxy.setupSinglePackage();
      folderProxy.setupReturnsPackage({ name: 'test-pkg' });
      singleProxy.setupLintOnlyFail({
        projectFolder: singlePackageProjectFolder,
        stdout: LINT_ERROR_REPORT,
      });
    },
    setupSinglePackageCrash: (): void => {
      workspaceProxy.setupSinglePackage();
      folderProxy.setupReturnsPackage({ name: 'test-pkg' });
      singleProxy.setupLintOnlyFail({ projectFolder: singlePackageProjectFolder, stdout: '[]' });
    },
    setupMultiPackagePass: ({
      packageCount,
      subResultContent,
    }: {
      packageCount: number;
      subResultContent: string;
    }): void => {
      const rootPath = AbsoluteFilePathStub({ value: '/project' });
      const projectFolders = Array.from({ length: packageCount }, () => ProjectFolderStub());
      multiProxy.setupSpawnAndLoad({ rootPath, projectFolders, subResultContent });
    },
    // No independent address exists for arbitrary stdout text — flatten via .map() (a real
    // transform over the WHOLE call history, not an unaddressed peek) so callers needing a
    // specific write's text by position (summary vs guidance) can still index the result.
    getStdoutCalls: (): unknown[] => stdoutSpy.callsMatching([]).map((call) => call[0]),
    getExitCalls: (): RecordedCalls => exitSpy.callsMatching([]),
  };
};
