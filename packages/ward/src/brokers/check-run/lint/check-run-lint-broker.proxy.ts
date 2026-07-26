import { childProcessSpawnCaptureAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  ErrorMessageStub,
  ExitCodeStub,
  absoluteFilePathContract,
} from '@dungeonmaster/shared/contracts';

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
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const binProxy = binResolveBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });
  const emptyMessage = ErrorMessageStub({ value: '' });

  const resolveCommand = ({ projectFolder }: { projectFolder: ProjectFolder }): BinCommand =>
    binProxy.setupFound({
      cwd: absoluteFilePathContract.parse(projectFolder.path),
      binName: BinCommandStub({ value: checkCommandsStatics.lint.bin }),
    });

  return {
    setupPass: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      captureProxy.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: '[]' }),
        stderr: emptyMessage,
      });
    },

    setupPassWithOutput: ({
      projectFolder,
      stdout,
    }: {
      projectFolder: ProjectFolder;
      stdout: string;
    }): void => {
      captureProxy.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: emptyMessage,
      });
    },

    setupFail: ({
      projectFolder,
      stdout,
    }: {
      projectFolder: ProjectFolder;
      stdout: string;
    }): void => {
      captureProxy.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        exitCode: failCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: emptyMessage,
      });
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
      captureProxy.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: ErrorMessageStub({ value: stderr }),
      });
    },

    setupNonJsonFailure: ({
      projectFolder,
      stdout,
    }: {
      projectFolder: ProjectFolder;
      stdout: string;
    }): void => {
      captureProxy.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        exitCode: failCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: emptyMessage,
      });
    },
  };
};
