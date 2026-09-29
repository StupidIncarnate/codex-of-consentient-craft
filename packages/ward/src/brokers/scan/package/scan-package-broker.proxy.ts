import { absoluteFilePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { runProxy } from '#gateway/node/child_process/run/run.proxy';

import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';
import { BinCommandStub } from '../../../contracts/bin-command/bin-command.stub';
import type { BinCommand } from '../../../contracts/bin-command/bin-command-contract';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { scanStatics } from '../../../statics/scan/scan-statics';

export const scanPackageBrokerProxy = (): {
  setupExit: (params: {
    projectFolder: ProjectFolder;
    rootPath: AbsoluteFilePath;
    exitCode: number;
    stdout: string;
    stderr: string;
  }) => void;
  setupSignalKill: (params: {
    projectFolder: ProjectFolder;
    rootPath: AbsoluteFilePath;
    stdout: string;
  }) => void;
  setupSpawnError: (params: {
    projectFolder: ProjectFolder;
    rootPath: AbsoluteFilePath;
    error: Error;
  }) => void;
  getEslintArgs: (params: {
    projectFolder: ProjectFolder;
  }) => ReturnType<ReturnType<typeof runProxy>['getCallsFor']>;
} => {
  const run = runProxy();
  const binProxy = binResolveBrokerProxy();

  // The eslint bin is resolved by walking up from the PACKAGE folder; the child itself runs from
  // the repo root.
  const resolveCommand = ({ projectFolder }: { projectFolder: ProjectFolder }): BinCommand =>
    binProxy.setupFound({
      cwd: absoluteFilePathContract.parse(projectFolder.path),
      binName: BinCommandStub({ value: scanStatics.eslint.bin }),
    });

  return {
    setupExit: ({ projectFolder, rootPath, exitCode, stdout, stderr }): void => {
      run.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        cwd: String(rootPath),
        exitCode,
        stdout,
        stderr,
      });
    },

    setupSignalKill: ({ projectFolder, rootPath, stdout }): void => {
      run.setupSignalKill({
        command: String(resolveCommand({ projectFolder })),
        cwd: String(rootPath),
        signal: 'SIGKILL',
        stdout,
        stderr: '',
      });
    },

    setupSpawnError: ({ projectFolder, rootPath, error }): void => {
      run.setupError({
        command: String(resolveCommand({ projectFolder })),
        cwd: String(rootPath),
        error,
      });
    },

    getEslintArgs: ({ projectFolder }): ReturnType<ReturnType<typeof runProxy>['getCallsFor']> =>
      run.getCallsFor({ command: String(resolveCommand({ projectFolder })) }),
  };
};
