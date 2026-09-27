import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';
import { RunNotFoundErrorProxy } from '#gateway/node/child_process/run-not-found.error.proxy';

import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';
import { BinCommandStub } from '../../../contracts/bin-command/bin-command.stub';
import type { BinCommand } from '../../../contracts/bin-command/bin-command-contract';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';

export const checkRunLintBrokerProxy = (): {
  setupPass: (params: { projectFolder: ProjectFolder }) => void;
  setupPassWithOutput: (params: { projectFolder: ProjectFolder; stdout: string }) => void;
  setupFail: (params: { projectFolder: ProjectFolder; stdout: string }) => void;
  setupPassWithStderr: (params: {
    projectFolder: ProjectFolder;
    stdout: string;
    stderr: string;
  }) => void;
  setupNonJsonFailure: (params: { projectFolder: ProjectFolder; stdout: string }) => void;
} => {
  const run = runProxy();
  RunNotFoundErrorProxy();
  const binProxy = binResolveBrokerProxy();

  const resolveCommand = ({ projectFolder }: { projectFolder: ProjectFolder }): BinCommand =>
    binProxy.setupFound({
      cwd: absoluteFilePathContract.parse(projectFolder.path),
      binName: BinCommandStub({ value: checkCommandsStatics.lint.bin }),
    });

  // Every eslint invocation this broker makes is a single call per test, so addressing by command
  // and cwd (both known from `projectFolder`) tells every scenario's call apart from every other's.
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
    run.setupSuccess({
      command: String(resolveCommand({ projectFolder })),
      cwd: String(absoluteFilePathContract.parse(projectFolder.path)),
      exitCode,
      stdout,
      stderr,
    });
  };

  return {
    setupPass: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      stage({ projectFolder, exitCode: 0, stdout: '[]', stderr: '' });
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

    setupNonJsonFailure: ({
      projectFolder,
      stdout,
    }: {
      projectFolder: ProjectFolder;
      stdout: string;
    }): void => {
      stage({ projectFolder, exitCode: 1, stdout, stderr: '' });
    },
  };
};
