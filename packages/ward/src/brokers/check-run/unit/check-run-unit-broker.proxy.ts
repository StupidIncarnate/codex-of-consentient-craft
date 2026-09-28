import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import {
  AbsoluteFilePathStub,
  absoluteFilePathContract,
  filePathContract,
  type AbsoluteFilePath,
} from '@dungeonmaster/shared/contracts';

import { globDiscoverFilesBrokerProxy } from '../../glob/discover-files/glob-discover-files-broker.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';
import { osTmpdirAdapterProxy } from '../../../adapters/os/tmpdir/os-tmpdir-adapter.proxy';
import { openHandleReportPathTransformer } from '../../../transformers/open-handle-report-path/open-handle-report-path-transformer';
import { openHandleReportStatics } from '../../../statics/open-handle-report/open-handle-report-statics';
import { jestDiscoverPatternsTransformer } from '../../../transformers/jest-discover-patterns/jest-discover-patterns-transformer';
import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';
import { sourceConditionSupportedBrokerProxy } from '../../source-condition/supported/source-condition-supported-broker.proxy';
import { BinCommandStub } from '../../../contracts/bin-command/bin-command.stub';
import type { BinCommand } from '../../../contracts/bin-command/bin-command-contract';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';

export const checkRunUnitBrokerProxy = (): {
  setupPass: (params: { projectFolder: ProjectFolder }) => void;
  setupPassWithOutput: (params: { projectFolder: ProjectFolder; stdout: string }) => void;
  setupFail: (params: { projectFolder: ProjectFolder; stdout: string }) => void;
  setupFailWithBadOutput: (params: { projectFolder: ProjectFolder }) => void;
  setupPassWithStderr: (params: {
    projectFolder: ProjectFolder;
    stdout: string;
    stderr: string;
  }) => void;
  setupFailWithStderr: (params: {
    projectFolder: ProjectFolder;
    stdout: string;
    stderr: string;
  }) => void;
  setupNoTestFiles: () => void;
  setDiscoveredFiles: (params: { files: string[] }) => void;
  setupPathExists: (params: {
    projectFolder: ProjectFolder;
    relativePath: string;
    exists: boolean;
  }) => void;
  setupSourceConditionUnsupported: (params: { projectFolder: ProjectFolder }) => void;
  setupHandleReport: (params: { content: string }) => void;
  getSpawnedHandleReportPath: () => unknown;
  getSpawnedArgs: () => unknown;
  getSpawnedNodeOptions: () => unknown;
} => {
  const run = runProxy();
  RunNotFoundErrorProxy();
  const sourceConditionProxy = sourceConditionSupportedBrokerProxy();
  const existsProxy = existsSyncProxy();
  const globProxy = globDiscoverFilesBrokerProxy();
  // The broker's OWN patterns, computed by the same real transformer it calls — every scenario
  // here stages `hasPackageJestConfig: true` via stageJestConfigPresent below, so this is the exact
  // pattern list the broker will query, not a guess.
  const { patterns: discoverPatterns } = jestDiscoverPatternsTransformer({
    checkType: 'unit',
    hasPackageJestConfig: true,
  });
  // The broker asks the OS for a scratch dir, then reads and deletes the report jest appended to it.
  // Default: an empty report, so a test that says nothing about leaks gets none.
  const tmpdirProxy = osTmpdirAdapterProxy();
  tmpdirProxy.returns({ path: '/tmp' });
  const handleReportPath = openHandleReportPathTransformer({
    tmpdir: AbsoluteFilePathStub({ value: '/tmp' }),
    checkType: 'unit',
    processId: process.pid,
  });
  const handleReadProxy = fsReadFileAdapterProxy();
  handleReadProxy.returns({ filePath: handleReportPath, content: '' });
  const handleUnlinkProxy = fsUnlinkAdapterProxy();
  handleUnlinkProxy.succeedsForAnyPath();
  // Default: the report file is absent, so a test that says nothing about leaks gets none — the
  // broker's own `wantsTimerWatch && existsSync(handleReportPath)` guard short-circuits before ever
  // reading it. `setupHandleReport` below overrides this to present for the tests that stage one.
  existsProxy.returns({ path: handleReportPath, exists: false });
  const binProxy = binResolveBrokerProxy();
  // The resolved bin path depends on projectFolder.path, so the getter below (which takes no
  // params) addresses the spawn read against whatever setup last resolved — set here, read there.
  const resolvedCommandRef: { value: BinCommand } = { value: BinCommandStub() };

  // The broker calls globSync once per unit discovery pattern. These tests assert on jest output
  // parsing, not which pattern discovered which file, so the default stages every real pattern
  // with the same result.
  globProxy.returnsForPatterns({ patterns: discoverPatterns, files: ['discovered.ts'] });

  // `sourceConditionSupportedBroker` (composed inside the broker) walks every ancestor of
  // whichever cwd `stage()` below is given — a composing caller (e.g. `singlePackageLayerBroker`)
  // may pass a projectFolder other than the default `ProjectFolderStub()` this file's own tests
  // use, so the "reachable" default is staged per-cwd, inside `stage()`, not once here against a
  // guessed path. `unsupportedCwds` remembers which cwd `setupSourceConditionUnsupported` marked
  // explicitly, so `stage()` never clobbers that with its own default regardless of call order.
  const unsupportedCwds = new Set<AbsoluteFilePath>();

  const resolveCommand = ({ projectFolder }: { projectFolder: ProjectFolder }): BinCommand => {
    const command = binProxy.setupFound({
      cwd: absoluteFilePathContract.parse(projectFolder.path),
      binName: BinCommandStub({ value: checkCommandsStatics.unit.bin }),
    });
    resolvedCommandRef.value = command;
    return command;
  };

  // The broker's FIRST existsSync call, every run, before anything else. Staged by exact path —
  // no wildcard — since every test that reaches `run` needs it, and `setupNoTestFiles` (which
  // never reaches `run`, but still reaches THIS check before the discoveredCount==0 return) stages
  // it separately below, against the same default ProjectFolderStub() path.
  const stageJestConfigPresent = ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
    existsProxy.returns({
      path: filePathContract.parse(
        `${String(absoluteFilePathContract.parse(projectFolder.path))}/jest.config.js`,
      ),
      exists: true,
    });
  };

  // Every scenario that reaches `run` shares this shape: jest.config.js answers present, the bin
  // resolves (via `resolveCommand`, which composes `binResolveBrokerProxy` — itself an
  // `existsSyncProxy` call against the SAME underlying mock), and `run` succeeds with the given
  // exit code and output. Addressed by COMMAND ONLY (no args/cwd): every test here stages one
  // outcome regardless of which of the broker's many arg-building branches actually ran.
  const stage = ({
    projectFolder,
    exitCode,
    stdout,
    stderr,
  }: {
    projectFolder: ProjectFolder;
    exitCode: number;
    stdout: string;
    stderr: string;
  }): void => {
    const cwd = absoluteFilePathContract.parse(projectFolder.path);
    if (!unsupportedCwds.has(cwd)) {
      sourceConditionProxy.setupSupported({ cwd });
    }
    stageJestConfigPresent({ projectFolder });
    const command = String(resolveCommand({ projectFolder }));
    run.setupSuccess({ command, exitCode, stdout, stderr });
  };

  return {
    setupPass: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      stage({
        projectFolder,
        exitCode: 0,
        stdout: '{"testResults":[],"numTotalTestSuites":0,"success":true}',
        stderr: '',
      });
    },

    setupPassWithOutput: ({
      projectFolder,
      stdout,
    }: {
      projectFolder: ProjectFolder;
      stdout: string;
    }): void => {
      stage({ projectFolder, exitCode: 0, stdout, stderr: '' });
    },

    setupFail: ({
      projectFolder,
      stdout,
    }: {
      projectFolder: ProjectFolder;
      stdout: string;
    }): void => {
      stage({ projectFolder, exitCode: 1, stdout, stderr: '' });
    },

    setupFailWithBadOutput: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      stage({ projectFolder, exitCode: 1, stdout: 'not valid json \x1b[31m', stderr: '' });
    },

    setupPassWithStderr: ({
      projectFolder,
      stdout,
      stderr,
    }: {
      projectFolder: ProjectFolder;
      stdout: string;
      stderr: string;
    }): void => {
      stage({ projectFolder, exitCode: 0, stdout, stderr });
    },

    setupFailWithStderr: ({
      projectFolder,
      stdout,
      stderr,
    }: {
      projectFolder: ProjectFolder;
      stdout: string;
      stderr: string;
    }): void => {
      stage({ projectFolder, exitCode: 1, stdout, stderr });
    },

    setupNoTestFiles: (): void => {
      stageJestConfigPresent({ projectFolder: ProjectFolderStub() });
      globProxy.returnsForPatterns({ patterns: discoverPatterns, files: [] });
    },

    setDiscoveredFiles: ({ files }: { files: string[] }): void => {
      globProxy.returnsForPatterns({ patterns: discoverPatterns, files });
    },

    // Every candidate companion path this broker checks is a distinct, fully-known string (the
    // source file's own base name plus one extension), so addressing by exact path — rather than
    // the call-order FIFO the old adapter-backed raw mock needed — tells every scenario apart with
    // no ambiguity.
    setupPathExists: ({
      projectFolder,
      relativePath,
      exists,
    }: {
      projectFolder: ProjectFolder;
      relativePath: string;
      exists: boolean;
    }): void => {
      existsProxy.returns({
        path: filePathContract.parse(
          `${String(absoluteFilePathContract.parse(projectFolder.path))}/${relativePath}`,
        ),
        exists,
      });
    },

    // Models a consumer's install: `@dungeonmaster/shared` packs `dist` only, so no ancestor of the
    // project folder holds the `source` barrel. Recorded in `unsupportedCwds` so `stage()` (called
    // by `setupPass` etc., whether before or after this) never re-stages this cwd as reachable.
    setupSourceConditionUnsupported: ({
      projectFolder,
    }: {
      projectFolder: ProjectFolder;
    }): void => {
      const cwd = absoluteFilePathContract.parse(projectFolder.path);
      unsupportedCwds.add(cwd);
      sourceConditionProxy.setupUnsupported({ cwd });
    },

    setupHandleReport: ({ content }: { content: string }): void => {
      existsProxy.returns({ path: handleReportPath, exists: true });
      handleReadProxy.returns({ filePath: handleReportPath, content });
    },

    getSpawnedHandleReportPath: (): unknown =>
      run.getOptionsFor({ command: String(resolvedCommandRef.value) }).at(-1)?.env[
        openHandleReportStatics.env.pathVar
      ],

    getSpawnedArgs: (): unknown =>
      run.getCallsFor({ command: String(resolvedCommandRef.value) }).at(-1),

    getSpawnedNodeOptions: (): unknown =>
      run.getOptionsFor({ command: String(resolvedCommandRef.value) }).at(-1)?.env.NODE_OPTIONS,
  };
};
