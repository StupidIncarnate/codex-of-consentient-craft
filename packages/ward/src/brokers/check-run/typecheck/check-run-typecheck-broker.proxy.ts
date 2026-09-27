import {
  childProcessSpawnCaptureAdapterProxy,
  fsExistsSyncAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  ErrorMessageStub,
  ExitCodeStub,
  filePathContract,
  absoluteFilePathContract,
} from '@dungeonmaster/shared/contracts';

import { fsGlobSyncAdapterProxy } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter.proxy';
import { fsReadJsonSyncAdapterProxy } from '../../../adapters/fs/read-json-sync/fs-read-json-sync-adapter.proxy';
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
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const globProxy = fsGlobSyncAdapterProxy();
  const jsonProxy = fsReadJsonSyncAdapterProxy();
  const binProxy = binResolveBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });
  const emptyMessage = ErrorMessageStub({ value: '' });

  // tsconfig.json's `include` expands into several extension-specific glob patterns
  // (expandToTsGlobsTransformer). Tests here assert on tsc output parsing, not on which
  // pattern discovered which file, so every pattern is described with one predicate.
  //
  // `tsconfig.build.json` defaults to NOT FOUND, so every scenario in this proxy is single-pass
  // unless a test calls `setupBuildConfigPresent` — every test written before that method existed
  // keeps exercising the same one tsc invocation it always did.
  const setupDiscovery = ({ projectFolder }: { projectFolder: ProjectFolder }): BinCommand => {
    const tsconfigPath = filePathContract.parse(`${projectFolder.path}/tsconfig.json`);
    const buildTsconfigPath = filePathContract.parse(`${projectFolder.path}/tsconfig.build.json`);
    existsProxy.returns({ filePath: tsconfigPath, result: true });
    existsProxy.returns({ filePath: buildTsconfigPath, result: false });
    jsonProxy.returns({
      filePath: tsconfigPath,
      content: '{"include":["src/**/*"]}',
    });
    globProxy.returnsForAnyPattern({ files: ['discovered.ts'] });
    return binProxy.setupFound({
      cwd: absoluteFilePathContract.parse(projectFolder.path),
      binName: BinCommandStub({ value: checkCommandsStatics.typecheck.bin }),
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
      const command = String(setupDiscovery({ projectFolder }));
      captureProxy.setupSuccess({
        command,
        exitCode: successCode,
        stdout: ErrorMessageStub({ value: stdout ?? '' }),
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
      const command = String(setupDiscovery({ projectFolder }));
      captureProxy.setupSuccess({
        command,
        exitCode: failCode,
        stdout: ErrorMessageStub({ value: stdout }),
        stderr: emptyMessage,
      });
    },

    // The "missing tsconfig.json" test in this file always exercises the default
    // ProjectFolderStub() path.
    setupNoTsconfig: (): void => {
      existsProxy.returns({
        filePath: filePathContract.parse(`${ProjectFolderStub().path}/tsconfig.json`),
        result: false,
      });
    },

    // Flips the default from setupDiscovery so the broker's second `tsc` invocation actually
    // spawns. Call this AFTER setupPass/setupFail — both call setupDiscovery internally, which
    // resets tsconfig.build.json back to not-found, so calling this first is silently undone. The
    // underlying spawn mock addresses only on the resolved COMMAND (the `tsc` bin path), identical
    // for both invocations, so whichever of setupPass/setupFail ran answers BOTH the checking and
    // the build pass the same way — real, distinct outcomes for the two configs (one passes, the
    // other fails) are proven in check-run-typecheck-broker.integration.test.ts against a real
    // fixture instead.
    setupBuildConfigPresent: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      const buildTsconfigPath = filePathContract.parse(`${projectFolder.path}/tsconfig.build.json`);
      existsProxy.returns({ filePath: buildTsconfigPath, result: true });
    },
  };
};
