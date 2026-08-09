/**
 * PURPOSE: Builds a real throwaway git repository per test (init, commits, branches, a synthetic
 * npm-workspace node_modules layout, and controllable build scripts) so the flowrider suites for
 * `quest-start-worktree` can drive real `git worktree add` / real fs symlinks / a real spawned
 * build process instead of a mocked `childProcessSpawnCaptureAdapter`. Reach for
 * `orchestrationQuestHarness.initGitRepoAndCommitBase` instead when a test only needs ONE commit
 * on whatever branch git defaults to — this harness exists for tests that need to choose which of
 * main/master exist, leave the repo root dirty, or observe the real git argv a broker issued.
 *
 * USAGE:
 * const git = gitWorktreeFixtureHarness();
 * const { baseRef } = await git.initRepoWithPackages({
 *   repoPath: AbsoluteFilePathStub({ value: testbed.guildPath }),
 *   initialBranchName: FileNameStub({ value: 'main' }),
 *   packageNames: [FileNameStub({ value: 'shared' }), FileNameStub({ value: 'web' })],
 * });
 * await git.createBranchAt({ repoPath, branchName: FileNameStub({ value: 'master' }) });
 */
import {
  accessSync,
  chmodSync,
  constants,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  symlinkSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
  errorMessageContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
  type FileContents,
  type FileName,
  type RepoRelativePath,
} from '@dungeonmaster/shared/contracts';

const BUILD_SCRIPT_FILENAME_CONVERGING = 'converging-build.js';
const BUILD_SCRIPT_FILENAME_FAILING = 'failing-build.js';
const ARGV_LOG_FILENAME = 'argv.log';
const SHIM_MODE = 0o755;

// Real committer identity + disabled GPG signing, scoped to the child process via env vars (not
// `-c` argv flags, not `git config` writes) so these throwaway fixture commits never depend on, or
// mutate, the developer's real global git config. Mirrors orchestrationQuestHarness's own
// gitCommitEnv rather than importing it — the two harnesses build different repo shapes and
// sharing one constant across them would couple them for no reason.
const GIT_COMMIT_ENV = {
  GIT_AUTHOR_NAME: 'Dungeonmaster Worktree Fixture',
  GIT_AUTHOR_EMAIL: 'worktree-fixture@dungeonmaster.test',
  GIT_COMMITTER_NAME: 'Dungeonmaster Worktree Fixture',
  GIT_COMMITTER_EMAIL: 'worktree-fixture@dungeonmaster.test',
  GIT_CONFIG_COUNT: '1',
  GIT_CONFIG_KEY_0: 'commit.gpgsign',
  GIT_CONFIG_VALUE_0: 'false',
};

export const gitWorktreeFixtureHarness = (): {
  initRepoWithPackages: (params: {
    repoPath: AbsoluteFilePath;
    initialBranchName: FileName;
    packageNames: readonly FileName[];
  }) => Promise<{ baseRef: ErrorMessage }>;
  createBranchAt: (params: {
    repoPath: AbsoluteFilePath;
    branchName: FileName;
    fromRef?: ErrorMessage;
  }) => Promise<void>;
  dirtyTrackedFile: (params: {
    repoPath: AbsoluteFilePath;
    relativePath: RepoRelativePath;
    content: FileContents;
  }) => void;
  readTextFile: (params: { absolutePath: AbsoluteFilePath }) => ErrorMessage | null;
  pathExists: (params: { absolutePath: AbsoluteFilePath }) => boolean;
  readSymlinkTarget: (params: { absolutePath: AbsoluteFilePath }) => ErrorMessage | null;
  isExecutableFile: (params: { absolutePath: AbsoluteFilePath }) => boolean;
  gitStatusPorcelain: (params: { repoPath: AbsoluteFilePath }) => Promise<ErrorMessage>;
  gitRevParseOrNull: (params: {
    repoPath: AbsoluteFilePath;
    ref: ErrorMessage;
  }) => Promise<ErrorMessage | null>;
  gitWorktreeListOutput: (params: { repoPath: AbsoluteFilePath }) => Promise<ErrorMessage>;
  writeWorkspaceNodeModulesFixture: (params: {
    repoPath: AbsoluteFilePath;
    workspacePackages: readonly FileName[];
    hoistedDep: { packageName: FileName; depName: FileName };
  }) => void;
  writeConvergingBuildScript: (params: { scriptDir: AbsoluteFilePath }) => {
    buildCommand: ErrorMessage;
  };
  writeFailingBuildScript: (params: { scriptDir: AbsoluteFilePath }) => {
    buildCommand: ErrorMessage;
  };
  captureGitArgv: (params: {
    captureDir: AbsoluteFilePath;
  }) => Promise<{ restore: () => void; readArgvLog: () => readonly ErrorMessage[] }>;
} => {
  const runGit = async (params: {
    repoPath: AbsoluteFilePath;
    args: readonly string[];
    env?: Record<string, string>;
  }): Promise<{ exitCode: ExitCode | null; output: ErrorMessage }> => {
    const { repoPath, args, env } = params;
    return childProcessSpawnCaptureAdapter({
      command: 'git',
      args: [...args],
      cwd: repoPath,
      ...(env === undefined ? {} : { env }),
    });
  };

  const initRepoWithPackages = async ({
    repoPath,
    initialBranchName,
    packageNames,
  }: {
    repoPath: AbsoluteFilePath;
    initialBranchName: FileName;
    packageNames: readonly FileName[];
  }): Promise<{ baseRef: ErrorMessage }> => {
    mkdirSync(repoPath, { recursive: true });
    await runGit({ repoPath, args: ['init', '-b', initialBranchName] });
    writeFileSync(join(repoPath, 'README.md'), '# fixture repo\n');
    for (const packageName of packageNames) {
      const packageDir = join(repoPath, 'packages', packageName);
      mkdirSync(packageDir, { recursive: true });
      writeFileSync(
        join(packageDir, 'package.json'),
        JSON.stringify({ name: `@dungeonmaster/${packageName}`, version: '1.0.0' }, null, 2),
      );
    }
    await runGit({ repoPath, args: ['add', '-A'] });
    await runGit({ repoPath, args: ['commit', '-m', 'base'], env: GIT_COMMIT_ENV });
    const { output } = await runGit({ repoPath, args: ['rev-parse', 'HEAD'] });
    return { baseRef: errorMessageContract.parse(output.trim()) };
  };

  const createBranchAt = async ({
    repoPath,
    branchName,
    fromRef,
  }: {
    repoPath: AbsoluteFilePath;
    branchName: FileName;
    fromRef?: ErrorMessage;
  }): Promise<void> => {
    await runGit({
      repoPath,
      args: fromRef === undefined ? ['branch', branchName] : ['branch', branchName, fromRef],
    });
  };

  const gitRevParseOrNull = async ({
    repoPath,
    ref,
  }: {
    repoPath: AbsoluteFilePath;
    ref: ErrorMessage;
  }): Promise<ErrorMessage | null> => {
    const { exitCode, output } = await runGit({ repoPath, args: ['rev-parse', ref] });
    return exitCode === 0 ? errorMessageContract.parse(output.trim()) : null;
  };

  return {
    initRepoWithPackages,
    createBranchAt,
    dirtyTrackedFile: ({
      repoPath,
      relativePath,
      content,
    }: {
      repoPath: AbsoluteFilePath;
      relativePath: RepoRelativePath;
      content: FileContents;
    }): void => {
      writeFileSync(join(repoPath, relativePath), content);
    },
    readTextFile: ({ absolutePath }: { absolutePath: AbsoluteFilePath }): ErrorMessage | null =>
      existsSync(absolutePath)
        ? errorMessageContract.parse(readFileSync(absolutePath, 'utf-8'))
        : null,
    pathExists: ({ absolutePath }: { absolutePath: AbsoluteFilePath }): boolean =>
      existsSync(absolutePath),
    readSymlinkTarget: ({
      absolutePath,
    }: {
      absolutePath: AbsoluteFilePath;
    }): ErrorMessage | null => {
      try {
        return errorMessageContract.parse(readlinkSync(absolutePath));
      } catch {
        return null;
      }
    },
    isExecutableFile: ({ absolutePath }: { absolutePath: AbsoluteFilePath }): boolean => {
      try {
        const stat = lstatSync(absolutePath);
        // accessSync(X_OK) rather than a mode-bit test: the repo bans bitwise operators, and
        // this asks the OS the question the observable actually cares about — "can this be
        // executed" — instead of re-deriving it from a permission mask.
        accessSync(absolutePath, constants.X_OK);
        return stat.isFile();
      } catch {
        return false;
      }
    },
    gitStatusPorcelain: async ({
      repoPath,
    }: {
      repoPath: AbsoluteFilePath;
    }): Promise<ErrorMessage> => {
      const { output } = await runGit({ repoPath, args: ['status', '--porcelain'] });
      return errorMessageContract.parse(output.trim());
    },
    gitRevParseOrNull,
    gitWorktreeListOutput: async ({
      repoPath,
    }: {
      repoPath: AbsoluteFilePath;
    }): Promise<ErrorMessage> => {
      const { output } = await runGit({ repoPath, args: ['worktree', 'list'] });
      return errorMessageContract.parse(output);
    },
    writeWorkspaceNodeModulesFixture: ({
      repoPath,
      workspacePackages,
      hoistedDep,
    }: {
      repoPath: AbsoluteFilePath;
      workspacePackages: readonly FileName[];
      hoistedDep: { packageName: FileName; depName: FileName };
    }): void => {
      const nodeModules = join(repoPath, 'node_modules');
      mkdirSync(nodeModules, { recursive: true });

      const thirdPartyDir = join(nodeModules, 'zod');
      mkdirSync(thirdPartyDir, { recursive: true });
      writeFileSync(
        join(thirdPartyDir, 'package.json'),
        JSON.stringify({ name: 'zod', version: '1.0.0' }),
      );

      const binDir = join(nodeModules, '.bin');
      mkdirSync(binDir, { recursive: true });
      const jestShim = join(binDir, 'jest');
      writeFileSync(jestShim, '#!/bin/sh\necho fixture-jest\n');
      chmodSync(jestShim, SHIM_MODE);

      const scopeDir = join(nodeModules, '@dungeonmaster');
      mkdirSync(scopeDir, { recursive: true });
      for (const packageName of workspacePackages) {
        symlinkSync(join('..', '..', 'packages', packageName), join(scopeDir, packageName));
      }

      const hoistedDepDir = join(
        repoPath,
        'packages',
        hoistedDep.packageName,
        'node_modules',
        hoistedDep.depName,
      );
      mkdirSync(hoistedDepDir, { recursive: true });
      writeFileSync(
        join(hoistedDepDir, 'package.json'),
        JSON.stringify({ name: hoistedDep.depName, version: '1.0.0' }),
      );
    },
    writeConvergingBuildScript: ({
      scriptDir,
    }: {
      scriptDir: AbsoluteFilePath;
    }): { buildCommand: ErrorMessage } => {
      mkdirSync(scriptDir, { recursive: true });
      const scriptPath = join(scriptDir, BUILD_SCRIPT_FILENAME_CONVERGING);
      writeFileSync(
        scriptPath,
        [
          "const fs = require('fs');",
          "const path = require('path');",
          'const cwd = process.cwd();',
          "const marker = path.join(cwd, '.build-pass-count');",
          "const count = fs.existsSync(marker) ? Number(fs.readFileSync(marker, 'utf8')) + 1 : 1;",
          'fs.writeFileSync(marker, String(count));',
          "fs.mkdirSync(path.join(cwd, 'packages', 'shared', 'dist'), { recursive: true });",
          "fs.writeFileSync(path.join(cwd, 'packages', 'shared', 'dist', 'contracts.js'), '// built pass ' + count + '\\n');",
          'if (count < 2) {',
          '  process.exit(1);',
          '}',
          "fs.mkdirSync(path.join(cwd, 'packages', 'web', 'dist'), { recursive: true });",
          "fs.writeFileSync(path.join(cwd, 'packages', 'web', 'dist', 'index.html'), '<html></html>\\n');",
          'process.exit(0);',
          '',
        ].join('\n'),
      );
      return { buildCommand: errorMessageContract.parse(`node ${scriptPath}`) };
    },
    writeFailingBuildScript: ({
      scriptDir,
    }: {
      scriptDir: AbsoluteFilePath;
    }): { buildCommand: ErrorMessage } => {
      mkdirSync(scriptDir, { recursive: true });
      const scriptPath = join(scriptDir, BUILD_SCRIPT_FILENAME_FAILING);
      writeFileSync(
        scriptPath,
        "process.stderr.write('fixture build always fails\\n');\nprocess.exit(1);\n",
      );
      return { buildCommand: errorMessageContract.parse(`node ${scriptPath}`) };
    },
    captureGitArgv: async ({
      captureDir,
    }: {
      captureDir: AbsoluteFilePath;
    }): Promise<{ restore: () => void; readArgvLog: () => readonly ErrorMessage[] }> => {
      mkdirSync(captureDir, { recursive: true });
      const { output: realGitPath } = await childProcessSpawnCaptureAdapter({
        command: 'command',
        args: ['-v', 'git'],
        cwd: captureDir,
      });
      const resolvedGitPath = realGitPath.trim();
      const logPath = join(captureDir, ARGV_LOG_FILENAME);
      const shimPath = join(captureDir, 'git');
      writeFileSync(
        shimPath,
        [
          '#!/bin/sh',
          `printf '%s\\n' "$*" >> "${logPath}"`,
          `exec "${resolvedGitPath}" "$@"`,
          '',
        ].join('\n'),
      );
      chmodSync(shimPath, SHIM_MODE);

      const savedPath = process.env.PATH;
      process.env.PATH = `${captureDir}:${savedPath ?? ''}`;

      return {
        restore: (): void => {
          process.env.PATH = savedPath;
        },
        readArgvLog: (): readonly ErrorMessage[] =>
          existsSync(logPath)
            ? readFileSync(logPath, 'utf-8')
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line.length > 0)
                .map((line) => errorMessageContract.parse(line))
            : [],
      };
    },
  };
};
