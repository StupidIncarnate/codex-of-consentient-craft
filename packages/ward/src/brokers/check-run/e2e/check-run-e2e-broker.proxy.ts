import {
  childProcessSpawnCaptureAdapterProxy,
  fsExistsSyncAdapterProxy,
  netFreePortAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  ErrorMessageStub,
  ExitCodeStub,
  filePathContract,
  absoluteFilePathContract,
} from '@dungeonmaster/shared/contracts';

import { fsGlobSyncAdapterProxy } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter.proxy';
import { netKillPortAdapterProxy } from '../../../adapters/net/kill-port/net-kill-port-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';
import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';
import { BinCommandStub } from '../../../contracts/bin-command/bin-command.stub';
import type { BinCommand } from '../../../contracts/bin-command/bin-command-contract';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';

export const checkRunE2eBrokerProxy = (): {
  setupPass: (params: { projectFolder: ProjectFolder }) => void;
  setupPassWithOutput: (params: { projectFolder: ProjectFolder; stdout: string }) => void;
  setupPassWithJsonReport: (params: { projectFolder: ProjectFolder; jsonContent: string }) => void;
  setupFail: (params: { projectFolder: ProjectFolder; stdout: string }) => void;
  setupFailWithEmptyOutput: (params: { projectFolder: ProjectFolder }) => void;
  setupNoPlaywrightConfig: (params: { projectFolder: ProjectFolder }) => void;
  getSpawnedArgs: () => unknown;
  getSpawnedOptions: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const freePortProxy = netFreePortAdapterProxy();
  // e2e discovery has exactly one static pattern (checkCommandsStatics.e2e.discoverPatterns),
  // unlike unit/integration which loop over a dozen. The pattern is known, so key on it exactly.
  const globProxy = fsGlobSyncAdapterProxy();
  globProxy.returnsForPattern({ pattern: '**/*.e2e.ts', files: ['discovered.ts'] });
  netKillPortAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  // Unstaged: fsUnlinkAdapter's return value is discarded by the broker (it deletes the
  // playwright json report best-effort, under a try/catch that ignores the outcome either way),
  // so there is no address worth describing here.
  fsUnlinkAdapterProxy();
  const binProxy = binResolveBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });
  const emptyMessage = ErrorMessageStub({ value: '' });

  const queueFreePorts = (): void => {
    freePortProxy.setupPort({ port: 40_000 });
  };

  const resolveCommand = ({ projectFolder }: { projectFolder: ProjectFolder }): BinCommand =>
    binProxy.setupFound({
      cwd: absoluteFilePathContract.parse(projectFolder.path),
      binName: BinCommandStub({ value: checkCommandsStatics.e2e.bin }),
    });

  const setupPlaywrightConfigExists = ({
    projectFolder,
  }: {
    projectFolder: ProjectFolder;
  }): void => {
    existsProxy.returns({
      filePath: filePathContract.parse(`${projectFolder.path}/playwright.config.ts`),
      result: true,
    });
  };

  return {
    setupPass: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      setupPlaywrightConfigExists({ projectFolder });
      queueFreePorts();
      captureProxy.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        exitCode: successCode,
        stdout: emptyMessage,
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
      setupPlaywrightConfigExists({ projectFolder });
      queueFreePorts();
      captureProxy.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: emptyMessage,
      });
    },

    setupPassWithJsonReport: ({
      projectFolder,
      jsonContent,
    }: {
      projectFolder: ProjectFolder;
      jsonContent: string;
    }): void => {
      setupPlaywrightConfigExists({ projectFolder });
      queueFreePorts();
      captureProxy.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        exitCode: successCode,
        stdout: emptyMessage,
        stderr: emptyMessage,
      });
      readFileProxy.returns({
        filePath: filePathContract.parse(`${projectFolder.path}/.ward-playwright-report.json`),
        content: jsonContent,
      });
    },

    setupFail: ({
      projectFolder,
      stdout,
    }: {
      projectFolder: ProjectFolder;
      stdout: string;
    }): void => {
      setupPlaywrightConfigExists({ projectFolder });
      queueFreePorts();
      captureProxy.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        exitCode: failCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: emptyMessage,
      });
    },

    setupFailWithEmptyOutput: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      setupPlaywrightConfigExists({ projectFolder });
      queueFreePorts();
      captureProxy.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        exitCode: failCode,
        stdout: emptyMessage,
        stderr: emptyMessage,
      });
    },

    setupNoPlaywrightConfig: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      existsProxy.returns({
        filePath: filePathContract.parse(`${projectFolder.path}/playwright.config.ts`),
        result: false,
      });
    },

    getSpawnedArgs: (): unknown => captureProxy.getSpawnedArgs(),
    getSpawnedOptions: (): unknown => captureProxy.getSpawnedOptions(),
  };
};
