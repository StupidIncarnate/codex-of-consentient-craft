import {
  architecturePackageE2eEligibleDetectBrokerProxy,
  childProcessSpawnCaptureAdapterProxy,
  fsExistsSyncAdapterProxy,
  netFreePortPairAdapterProxy,
} from '@dungeonmaster/shared/testing';
import {
  ErrorMessageStub,
  ExitCodeStub,
  filePathContract,
  absoluteFilePathContract,
} from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsGlobSyncAdapterProxy } from '../../../adapters/fs/glob-sync/fs-glob-sync-adapter.proxy';
import { netKillPortAdapterProxy } from '../../../adapters/net/kill-port/net-kill-port-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';
import { e2eArtifactsRemoveBrokerProxy } from '../../e2e-artifacts/remove/e2e-artifacts-remove-broker.proxy';
import { binResolveBrokerProxy } from '../../bin/resolve/bin-resolve-broker.proxy';
import { bundleBuildBrokerProxy } from '../../bundle/build/bundle-build-broker.proxy';
import { BinCommandStub } from '../../../contracts/bin-command/bin-command.stub';
import type { BinCommand } from '../../../contracts/bin-command/bin-command-contract';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';

// The sha-256 of the three files bundleBuildBrokerProxy's single-package fixture stages, in sorted
// path order relative to the package root. Editing any of those contents changes this number.
const BUNDLE_HASH = '1d36195dbed4d762ee44bad0c0a391b267a8b412c2832995e82a59b16fe9d184';

export const checkRunE2eBrokerProxy = (): {
  setupPass: (params: { projectFolder: ProjectFolder }) => void;
  setupPassWithBundle: (params: { projectFolder: ProjectFolder }) => void;
  getBundleDir: (params: { projectFolder: ProjectFolder }) => AbsoluteFilePath;
  setupPassWithOutput: (params: { projectFolder: ProjectFolder; stdout: string }) => void;
  setupPassWithJsonReport: (params: { projectFolder: ProjectFolder; jsonContent: string }) => void;
  setupFail: (params: { projectFolder: ProjectFolder; stdout: string }) => void;
  setupFailWithEmptyOutput: (params: { projectFolder: ProjectFolder }) => void;
  setupNotE2eEligible: (params: { projectFolder: ProjectFolder }) => void;
  setupEligibleMissingConfig: (params: { projectFolder: ProjectFolder }) => void;
  getRemovedCachePaths: (params: { projectFolder: ProjectFolder }) => readonly unknown[][];
  getSpawnedArgs: () => unknown;
  getSpawnedEnvValue: (params: { key: string }) => unknown;
  getSpawnedOptions: () => unknown;
} => {
  const captureProxy = childProcessSpawnCaptureAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const eligibleProxy = architecturePackageE2eEligibleDetectBrokerProxy();
  const freePortProxy = netFreePortPairAdapterProxy();
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
  // The broker discards this result and swallows its own errors, so nothing here needs staging for
  // the run to work. It IS staged, because the removal is behaviour worth asserting: the port it
  // deletes under, and that it still fires on the early-return path below.
  const removeProxy = e2eArtifactsRemoveBrokerProxy();
  const binProxy = binResolveBrokerProxy();
  // Every setup below except setupPassWithBundle leaves the bundle broker's own manifest read
  // UNSTAGED, so it answers "no build script" and the run gets no bundle — which is what those
  // setups' expectations describe.
  const bundleProxy = bundleBuildBrokerProxy();
  const successCode = ExitCodeStub({ value: 0 });
  const failCode = ExitCodeStub({ value: 1 });
  const emptyMessage = ErrorMessageStub({ value: '' });
  // The resolved bin path depends on projectFolder.path, so the getters below (which take no
  // params) address the spawn read against whatever setup last resolved — set here, read there.
  const resolvedCommandRef: { value: BinCommand } = { value: BinCommandStub() };

  // The broker names its Playwright report AND its vite cache after the SERVER port, so this
  // number, the readFile address in setupPassWithJsonReport, and the removal staged below all have
  // to move together.
  const STAGED_SERVER_PORT = 40_000;

  const queueFreePorts = (): void => {
    freePortProxy.setupPorts({ firstPort: STAGED_SERVER_PORT, secondPort: 51_244 });
  };

  const stageCacheRemoval = ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
    removeProxy.setupRemovable({
      packageRoot: absoluteFilePathContract.parse(projectFolder.path),
      port: STAGED_SERVER_PORT,
    });
  };

  const resolveCommand = ({ projectFolder }: { projectFolder: ProjectFolder }): BinCommand => {
    const command = binProxy.setupFound({
      cwd: absoluteFilePathContract.parse(projectFolder.path),
      binName: BinCommandStub({ value: checkCommandsStatics.e2e.bin }),
    });
    resolvedCommandRef.value = command;
    return command;
  };

  const markEligible = ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
    eligibleProxy.setupPackage({
      packageRoot: String(projectFolder.path),
      srcDirNames: ['widgets'],
      packageJsonContent: JSON.stringify({ dependencies: { react: '18.2.0' } }),
    });
  };

  const setupPlaywrightConfigExists = ({
    projectFolder,
  }: {
    projectFolder: ProjectFolder;
  }): void => {
    markEligible({ projectFolder });
    existsProxy.returns({
      filePath: filePathContract.parse(`${projectFolder.path}/playwright.config.ts`),
      result: true,
    });
  };

  const bundleDirFor = ({ projectFolder }: { projectFolder: ProjectFolder }): AbsoluteFilePath =>
    bundleProxy.bundleDirFor({
      packageRoot: absoluteFilePathContract.parse(projectFolder.path),
      hash: BUNDLE_HASH,
    });

  const stageCachedBundle = ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
    bundleProxy.setupCachedSinglePackageBundle({
      packageRoot: absoluteFilePathContract.parse(projectFolder.path),
      hash: BUNDLE_HASH,
    });
  };

  return {
    setupPass: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      setupPlaywrightConfigExists({ projectFolder });
      queueFreePorts();
      stageCacheRemoval({ projectFolder });
      captureProxy.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        exitCode: successCode,
        stdout: emptyMessage,
        stderr: emptyMessage,
      });
    },

    setupPassWithBundle: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      setupPlaywrightConfigExists({ projectFolder });
      queueFreePorts();
      stageCacheRemoval({ projectFolder });
      stageCachedBundle({ projectFolder });
      captureProxy.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        exitCode: successCode,
        stdout: emptyMessage,
        stderr: emptyMessage,
      });
    },

    getBundleDir: ({ projectFolder }: { projectFolder: ProjectFolder }): AbsoluteFilePath =>
      bundleDirFor({ projectFolder }),

    setupPassWithOutput: ({
      projectFolder,
      stdout,
    }: {
      projectFolder: ProjectFolder;
      stdout: string;
    }): void => {
      setupPlaywrightConfigExists({ projectFolder });
      queueFreePorts();
      stageCacheRemoval({ projectFolder });
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
      stageCacheRemoval({ projectFolder });
      captureProxy.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        exitCode: successCode,
        stdout: emptyMessage,
        stderr: emptyMessage,
      });
      readFileProxy.returns({
        filePath: filePathContract.parse(
          `${projectFolder.path}/.ward-playwright-report-40000.json`,
        ),
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
      stageCacheRemoval({ projectFolder });
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
      stageCacheRemoval({ projectFolder });
      captureProxy.setupSuccess({
        command: String(resolveCommand({ projectFolder })),
        exitCode: failCode,
        stdout: emptyMessage,
        stderr: emptyMessage,
      });
    },

    setupNotE2eEligible: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      eligibleProxy.setupPackage({
        packageRoot: String(projectFolder.path),
        srcDirNames: ['brokers'],
      });
      existsProxy.returns({
        filePath: filePathContract.parse(`${projectFolder.path}/playwright.config.ts`),
        result: false,
      });
    },

    setupEligibleMissingConfig: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      markEligible({ projectFolder });
      existsProxy.returns({
        filePath: filePathContract.parse(`${projectFolder.path}/playwright.config.ts`),
        result: false,
      });
    },

    getRemovedCachePaths: ({
      projectFolder,
    }: {
      projectFolder: ProjectFolder;
    }): readonly unknown[][] =>
      removeProxy.getRemovedPaths({
        packageRoot: absoluteFilePathContract.parse(projectFolder.path),
        port: STAGED_SERVER_PORT,
      }),
    getSpawnedArgs: (): unknown =>
      captureProxy.getSpawnedArgs({ command: String(resolvedCommandRef.value) }),
    getSpawnedEnvValue: ({ key }: { key: string }): unknown =>
      captureProxy.getSpawnedEnvValue({ command: String(resolvedCommandRef.value), key }),
    getSpawnedOptions: (): unknown =>
      captureProxy.getSpawnedOptions({ command: String(resolvedCommandRef.value) }),
  };
};
