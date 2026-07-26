import {
  childProcessSpawnCaptureAdapterProxy,
  fsExistsSyncAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  ErrorMessageStub,
  ExitCodeStub,
  absoluteFilePathContract,
} from '@dungeonmaster/shared/contracts';

import { fsGlobSyncAdapterProxy } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter.proxy';
import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';
import { BinCommandStub } from '../../../contracts/bin-command/bin-command.stub';
import type { BinCommand } from '../../../contracts/bin-command/bin-command-contract';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';

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
  getSpawnedArgs: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const globProxy = fsGlobSyncAdapterProxy();
  const binProxy = binResolveBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });
  const emptyMessage = ErrorMessageStub({ value: '' });
  // The resolved bin path depends on projectFolder.path, so the getter below (which takes no
  // params) addresses the spawn read against whatever setup last resolved — set here, read there.
  const resolvedCommandRef: { value: BinCommand } = { value: BinCommandStub() };

  // The broker calls globSync once per integration discovery pattern (16 patterns from
  // jestDiscoverPatternsTransformer). These tests assert on jest output parsing, not which
  // pattern discovered which file, so the default describes every pattern with one predicate.
  globProxy.returnsForAnyPattern({ files: ['discovered.ts'] });
  // The broker only checks jest.config.js's existence — every scenario here wants it to exist.
  existsProxy.implementation({ fn: () => true });

  const resolveCommand = ({ projectFolder }: { projectFolder: ProjectFolder }): BinCommand => {
    const command = binProxy.setupFound({
      cwd: absoluteFilePathContract.parse(projectFolder.path),
      binName: BinCommandStub({ value: checkCommandsStatics.integration.bin }),
    });
    resolvedCommandRef.value = command;
    return command;
  };

  return {
    setupPass: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      captureProxy.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        exitCode: successCode,
        stdout: ErrorMessageStub({
          value: '{"testResults":[],"numTotalTestSuites":0,"success":true}',
        }),
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

    setupFailWithBadOutput: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      captureProxy.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        exitCode: failCode,
        stdout: ErrorMessageStub({ value: 'not valid json \x1b[31m' }),
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

    setupFailWithStderr: ({
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
        exitCode: failCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: ErrorMessageStub({ value: stderr }),
      });
    },

    setupNoTestFiles: (): void => {
      globProxy.returnsForAnyPattern({ files: [] });
    },

    setDiscoveredFiles: ({ files }: { files: string[] }): void => {
      globProxy.returnsForAnyPattern({ files });
    },

    getSpawnedArgs: (): unknown =>
      captureProxy.getSpawnedArgs({ command: String(resolvedCommandRef.value) }),
  };
};
