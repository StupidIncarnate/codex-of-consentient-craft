import { existsSync } from 'fs';
import {
  childProcessSpawnCaptureAdapterProxy,
  fsExistsSyncAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  ErrorMessageStub,
  ExitCodeStub,
  absoluteFilePathContract,
} from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { fsGlobSyncAdapterProxy } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter.proxy';
import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';
import { BinCommandStub } from '../../../contracts/bin-command/bin-command.stub';
import type { BinCommand } from '../../../contracts/bin-command/bin-command-contract';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';

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
  queueFsExists: (params: { result: boolean }) => void;
  getSpawnedArgs: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  // Raw handle on the same existsSync mock existsProxy addresses, used only by queueFsExists below
  // to answer a specific SEQUENCE of calls (jest.config.js, then each candidate .test.<ext>
  // companion in order) differently — the shared proxy only exposes sticky calledWith staging,
  // which cannot express "this call gets true, the next gets false."
  const existsHandle = registerMock({ fn: existsSync });
  const globProxy = fsGlobSyncAdapterProxy();
  const binProxy = binResolveBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });
  const emptyMessage = ErrorMessageStub({ value: '' });
  // The resolved bin path depends on projectFolder.path, so the getter below (which takes no
  // params) addresses the spawn read against whatever setup last resolved — set here, read there.
  const resolvedCommandRef: { value: BinCommand } = { value: BinCommandStub() };

  // The broker calls globSync once per unit discovery pattern (8 patterns from
  // jestDiscoverPatternsTransformer). These tests assert on jest output parsing, not which
  // pattern discovered which file, so the default describes every pattern with one predicate.
  globProxy.returnsForAnyPattern({ files: ['discovered.ts'] });
  // The broker also calls existsSync for jest.config.js and, per passthrough file, for a colocated
  // .test.ts companion. Most scenarios here don't care which specific path is asked about — only
  // queueFsExists (below) overrides this for the companion-filtering tests.
  existsProxy.implementation({ fn: () => true });

  const resolveCommand = ({ projectFolder }: { projectFolder: ProjectFolder }): BinCommand => {
    const command = binProxy.setupFound({
      cwd: absoluteFilePathContract.parse(projectFolder.path),
      binName: BinCommandStub({ value: checkCommandsStatics.unit.bin }),
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

    queueFsExists: ({ result }: { result: boolean }): void => {
      existsHandle.onceFor([]).returns(result);
    },

    getSpawnedArgs: (): unknown =>
      captureProxy.getSpawnedArgs({ command: String(resolvedCommandRef.value) }),
  };
};
