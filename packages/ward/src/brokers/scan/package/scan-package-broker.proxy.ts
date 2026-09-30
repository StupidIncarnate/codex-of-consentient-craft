import { runProxy } from '#gateway/node/child_process/run/run.proxy';

import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { scanStatics } from '../../../statics/scan/scan-statics';

export const scanPackageBrokerProxy = (): {
  setupExit: (params: {
    projectFolder: ProjectFolder;
    rootPath: string;
    exitCode: number;
    stdout: string;
    stderr: string;
  }) => void;
  setupSignalKill: (params: {
    projectFolder: ProjectFolder;
    rootPath: string;
    stdout: string;
  }) => void;
  setupSpawnError: (params: {
    projectFolder: ProjectFolder;
    rootPath: string;
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
  const resolveCommand = ({ projectFolder }: { projectFolder: ProjectFolder }): string =>
    binProxy.setupFound({
      cwd: projectFolder.path,
      binName: scanStatics.eslint.bin,
    });

  return {
    setupExit: ({ projectFolder, rootPath, exitCode, stdout, stderr }): void => {
      run.setupSuccess({
        command: resolveCommand({ projectFolder }),
        cwd: rootPath,
        exitCode,
        stdout,
        stderr,
      });
    },

    setupSignalKill: ({ projectFolder, rootPath, stdout }): void => {
      run.setupSignalKill({
        command: resolveCommand({ projectFolder }),
        cwd: rootPath,
        signal: 'SIGKILL',
        stdout,
        stderr: '',
      });
    },

    setupSpawnError: ({ projectFolder, rootPath, error }): void => {
      run.setupError({
        command: resolveCommand({ projectFolder }),
        cwd: rootPath,
        error,
      });
    },

    getEslintArgs: ({ projectFolder }): ReturnType<ReturnType<typeof runProxy>['getCallsFor']> =>
      run.getCallsFor({ command: resolveCommand({ projectFolder }) }),
  };
};
