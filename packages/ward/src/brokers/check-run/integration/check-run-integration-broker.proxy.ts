import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { pid } from '#gateway/node/process';
import { pidProxy } from '#gateway/node/process/pid/pid.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { unlinkProxy } from '#gateway/node/fs__promises/unlink/unlink.proxy';

import { globDiscoverFilesBrokerProxy } from '../../glob/discover-files/glob-discover-files-broker.proxy';
import { tmpdirFindBrokerProxy } from '../../tmpdir/find/tmpdir-find-broker.proxy';
import { openHandleReportPathTransformer } from '../../../transformers/open-handle-report-path/open-handle-report-path-transformer';
import { openHandleReportStatics } from '../../../statics/open-handle-report/open-handle-report-statics';
import { jestDiscoverPatternsTransformer } from '../../../transformers/jest-discover-patterns/jest-discover-patterns-transformer';
import { runnerCommandResolveBrokerProxy } from '../../runner-command/resolve/runner-command-resolve-broker.proxy';
import { RunnerCommandStub } from '../../../contracts/runner-command/runner-command.stub';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';

export const checkRunIntegrationBrokerProxy = (): {
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
  setupSourceConditionUnsupported: (params: { projectFolder: ProjectFolder }) => void;
  setupHandleReport: (params: { content: string }) => void;
  getSpawnedHandleReportPath: () => unknown;
  getSpawnedArgs: () => unknown;
  getSpawnedCommandLine: () => unknown;
  getSpawnedNodeOptions: () => unknown;
} => {
  const run = runProxy();
  RunNotFoundErrorProxy();
  pidProxy();
  const existsProxy = existsSyncProxy();
  const globProxy = globDiscoverFilesBrokerProxy();
  // The broker's OWN patterns, computed by the same real transformer it calls — every scenario
  // here stages `hasPackageJestConfig: true` via stageJestConfigPresent below, so this is the exact
  // pattern list the broker will query, not a guess.
  const { patterns: discoverPatterns } = jestDiscoverPatternsTransformer({
    checkType: 'integration',
    hasPackageJestConfig: true,
  });
  // The broker asks the OS for a scratch dir, then reads and deletes the report jest appended to it.
  // Default: an empty report, so a test that says nothing about leaks gets none.
  const tmpdirProxy = tmpdirFindBrokerProxy();
  tmpdirProxy.returns({ path: '/tmp' });
  const handleReportPath = openHandleReportPathTransformer({
    tmpdir: '/tmp',
    checkType: 'integration',
    processId: pid,
  });
  const handleReadProxy = readFileProxy();
  handleReadProxy.returns({ path: handleReportPath, contents: '' });
  // Exact address, not a catch-all: handleReportPath is the only path this broker ever unlinks,
  // and the gateway's unlinkProxy carries no accept-all stage the way the old adapter proxy did.
  const handleUnlinkProxy = unlinkProxy();
  handleUnlinkProxy.succeeds({ path: handleReportPath });
  // Default: the report file is absent, so a test that says nothing about leaks gets none — the
  // broker's own `wantsTimerWatch && existsSync(handleReportPath)` guard short-circuits before ever
  // reading it. `setupHandleReport` below overrides this to present for the tests that stage one.
  existsProxy.returns({ path: handleReportPath, exists: false });
  const runnerProxy = runnerCommandResolveBrokerProxy();
  // The runner command depends on projectFolder.path, so the getters below (which take no params)
  // address the spawn read against whatever setup last resolved — set here, read there.
  const runnerRef: { value: ReturnType<typeof RunnerCommandStub> } = { value: RunnerCommandStub() };

  // The broker calls globSync once per integration discovery pattern. These tests assert on jest
  // output parsing, not which pattern discovered which file, so the default stages every real
  // pattern with the same result.
  globProxy.returnsForPatterns({ patterns: discoverPatterns, files: ['discovered.ts'] });

  // The runner command (composed inside the broker) depends on whether the `source` barrel is
  // reachable from whichever cwd `stage()` below is given — a composing caller (e.g.
  // `singlePackageLayerBroker`) may pass a projectFolder other than the default
  // `ProjectFolderStub()` this file's own tests use, so the "reachable" default is staged per-cwd,
  // inside `stage()`, not once here against a guessed path. `unsupportedCwds` remembers which cwd
  // `setupSourceConditionUnsupported` marked, so `stage()` stages that one as a consumer's install.
  const unsupportedCwds = new Set<string>();

  const resolveRunner = ({
    projectFolder,
  }: {
    projectFolder: ProjectFolder;
  }): ReturnType<typeof RunnerCommandStub> => {
    const cwd = projectFolder.path;
    const binName = checkCommandsStatics.integration.bin;
    const runner = unsupportedCwds.has(cwd)
      ? runnerProxy.setupBuiltRunner({ cwd, binName })
      : runnerProxy.setupSourceRunner({ cwd, binName });
    runnerRef.value = runner;
    return runner;
  };

  // The broker's FIRST existsSync call, every run, before anything else. Staged by exact path — no
  // wildcard — since every test that reaches `run` needs it.
  const stageJestConfigPresent = ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
    existsProxy.returns({
      path: `${String(projectFolder.path)}/jest.config.js`,
      exists: true,
    });
  };

  // Every scenario that reaches `run` shares this shape: jest.config.js answers present, the runner
  // command resolves (via `resolveRunner`, which composes `runnerCommandResolveBrokerProxy` — itself
  // `existsSyncProxy` calls against the SAME underlying mock), and `run` succeeds with the given exit
  // code and output. Addressed by the runner command and its leading args only, never the jest
  // args: every test here stages one outcome regardless of which of the broker's many arg-building
  // branches actually ran. The leading args are what tell jest apart from Playwright when both run
  // under the same node.
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
    stageJestConfigPresent({ projectFolder });
    const runner = resolveRunner({ projectFolder });
    run.setupSuccess({
      command: runner.command,
      args: (spawnArgs: readonly unknown[]): boolean =>
        runner.leadingArgs.every((leadingArg, index) => spawnArgs[index] === leadingArg),
      exitCode,
      stdout,
      stderr,
    });
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

    // Models a consumer's install: `@dungeonmaster/shared` packs `dist` only, so no ancestor of the
    // project folder holds the `source` barrel. Recorded in `unsupportedCwds`, which `stage()` reads,
    // so call this before `setupPass` and its siblings.
    setupSourceConditionUnsupported: ({
      projectFolder,
    }: {
      projectFolder: ProjectFolder;
    }): void => {
      unsupportedCwds.add(projectFolder.path);
    },

    setupHandleReport: ({ content }: { content: string }): void => {
      existsProxy.returns({ path: handleReportPath, exists: true });
      handleReadProxy.returns({ path: handleReportPath, contents: content });
    },

    getSpawnedHandleReportPath: (): unknown =>
      run.getOptionsFor({ command: runnerRef.value.command }).at(-1)?.env[
        openHandleReportStatics.env.pathVar
      ],

    // The arguments jest itself received: the spawn's args after the runner command's leading args.
    getSpawnedArgs: (): unknown =>
      run
        .getCallsFor({ command: runnerRef.value.command })
        .at(-1)
        ?.slice(runnerRef.value.leadingArgs.length),

    getSpawnedCommandLine: (): unknown => ({
      command: runnerRef.value.command,
      args: run.getCallsFor({ command: runnerRef.value.command }).at(-1),
    }),

    getSpawnedNodeOptions: (): unknown =>
      run.getOptionsFor({ command: runnerRef.value.command }).at(-1)?.env.NODE_OPTIONS,
  };
};
