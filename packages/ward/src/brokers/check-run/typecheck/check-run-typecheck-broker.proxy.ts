import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { globDiscoverFilesBrokerProxy } from '../../glob/discover-files/glob-discover-files-broker.proxy';
import { readJsonFileSyncIfExistsProxy } from '#gateway/node/fs/read-json-file-sync-if-exists/read-json-file-sync-if-exists.proxy';
import { tsconfigDiscoverPatternsTransformer } from '../../../transformers/tsconfig-discover-patterns/tsconfig-discover-patterns-transformer';
import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';
import { BinCommandStub } from '../../../contracts/bin-command/bin-command.stub';
import type { BinCommand } from '../../../contracts/bin-command/bin-command-contract';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import { ProjectFolderStub } from '../../../contracts/project-folder/project-folder.stub';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';

export const checkRunTypecheckBrokerProxy = (): {
  setupPass: (params: { projectFolder: ProjectFolder; stdout?: string }) => void;
  setupFail: (params: { projectFolder: ProjectFolder; stdout: string }) => void;
  setupNoTsconfig: () => void;
  setupBuildConfigPresent: (params: { projectFolder: ProjectFolder }) => void;
} => {
  const run = runProxy();
  RunNotFoundErrorProxy();
  const existsProxy = existsSyncProxy();
  const globProxy = globDiscoverFilesBrokerProxy();
  const jsonProxy = readJsonFileSyncIfExistsProxy();
  const binProxy = binResolveBrokerProxy();
  // The exact tsconfigData every scenario below stages through jsonProxy.returns() — computed by
  // the same real transformer the broker calls, not a guess, so the staged patterns are the ones
  // the broker will actually query.
  const { patterns: discoverPatterns } = tsconfigDiscoverPatternsTransformer({
    tsconfigData: { include: ['src/**/*'] },
  });

  // Tracks the checking pass's own outcome so setupBuildConfigPresent (called AFTER setupPass or
  // setupFail) can stage the SAME outcome under the build pass's own args address. runProxy
  // addresses by {command, args, cwd}, so the checking pass and the build pass — same resolved
  // `tsc` command, different args — no longer share one staged result the way the old adapter's
  // command-only address did; each needs its own exact stage.
  const lastChecking = { command: '', cwd: '', exitCode: 0, stdout: '' };

  // tsconfig.json's `include` expands into several extension-specific glob patterns
  // (expandToTsGlobsTransformer). Tests here assert on tsc output parsing, not on which pattern
  // discovered which file, so every real pattern (computed above by the same transformer the
  // broker calls) is staged with the same result.
  //
  // `tsconfig.build.json` defaults to NOT FOUND, so every scenario in this proxy is single-pass
  // unless a test calls `setupBuildConfigPresent` — every test written before that method existed
  // keeps exercising the same one tsc invocation it always did.
  const setupDiscovery = ({ projectFolder }: { projectFolder: ProjectFolder }): BinCommand => {
    const tsconfigPath = `${projectFolder.path}/tsconfig.json`;
    const buildTsconfigPath = `${projectFolder.path}/tsconfig.build.json`;
    existsProxy.returns({ path: tsconfigPath, exists: true });
    existsProxy.returns({ path: buildTsconfigPath, exists: false });
    jsonProxy.returns({
      path: String(tsconfigPath),
      json: '{"include":["src/**/*"]}',
    });
    globProxy.returnsForPatterns({ patterns: discoverPatterns, files: ['discovered.ts'] });
    return binProxy.setupFound({
      cwd: absoluteFilePathContract.parse(projectFolder.path),
      binName: BinCommandStub({ value: checkCommandsStatics.typecheck.bin }),
    });
  };

  const stageChecking = ({
    projectFolder,
    exitCode,
    stdout,
  }: {
    projectFolder: ProjectFolder;
    exitCode: number;
    stdout: string;
  }): void => {
    const command = String(setupDiscovery({ projectFolder }));
    const cwd = String(absoluteFilePathContract.parse(projectFolder.path));
    lastChecking.command = command;
    lastChecking.cwd = cwd;
    lastChecking.exitCode = exitCode;
    lastChecking.stdout = stdout;
    run.setupSuccess({
      command,
      cwd,
      args: [...checkCommandsStatics.typecheck.args],
      exitCode,
      stdout,
      stderr: '',
    });
  };

  return {
    setupPass: ({
      projectFolder,
      stdout,
    }: {
      projectFolder: ProjectFolder;
      stdout?: string;
    }): void => {
      stageChecking({ projectFolder, exitCode: 0, stdout: stdout ?? '' });
    },

    setupFail: ({
      projectFolder,
      stdout,
    }: {
      projectFolder: ProjectFolder;
      stdout: string;
    }): void => {
      stageChecking({ projectFolder, exitCode: 1, stdout });
    },

    // The "missing tsconfig.json" test in this file always exercises the default
    // ProjectFolderStub() path.
    setupNoTsconfig: (): void => {
      existsProxy.returns({
        path: `${ProjectFolderStub().path}/tsconfig.json`,
        exists: false,
      });
    },

    // Flips the default from setupDiscovery so the broker's second `tsc` invocation actually
    // spawns, and stages that second call's own args address with the SAME outcome the checking
    // pass already got — proving the merge/dedup logic (two runs, one real error, reported once)
    // no longer relies on both invocations colliding onto one shared, command-only address. Call
    // this AFTER setupPass/setupFail — both call setupDiscovery internally, which resets
    // tsconfig.build.json back to not-found, so calling this first is silently undone. A real
    // "checking pass clean, build pass fails" outcome needs the two runs to actually disagree,
    // which needs a real `tsc` — see check-run-typecheck-broker.integration.test.ts.
    setupBuildConfigPresent: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      const buildTsconfigPath = `${projectFolder.path}/tsconfig.build.json`;
      existsProxy.returns({ path: buildTsconfigPath, exists: true });
      run.setupSuccess({
        command: lastChecking.command,
        cwd: lastChecking.cwd,
        args: [...checkCommandsStatics.typecheck.buildArgs, '-p', String(buildTsconfigPath)],
        exitCode: lastChecking.exitCode,
        stdout: lastChecking.stdout,
        stderr: '',
      });
    },
  };
};
