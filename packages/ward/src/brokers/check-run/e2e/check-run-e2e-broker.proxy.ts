import { architecturePackageE2eEligibleDetectBrokerProxy } from '@dungeonmaster/shared/brokers/architecture/package-e2e-eligible-detect/architecture-package-e2e-eligible-detect-broker.proxy';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { configResolveBrokerProxy } from '@dungeonmaster/config/startup/start-config.proxy';
import { DungeonmasterConfigStub } from '@dungeonmaster/config/contracts/dungeonmaster-config/dungeonmaster-config.stub';

import { globDiscoverFilesBrokerProxy } from '../../glob/discover-files/glob-discover-files-broker.proxy';
import { runnerCommandResolveBrokerProxy } from '../../runner-command/resolve/runner-command-resolve-broker.proxy';
import { bundleBuildBrokerProxy } from '../../bundle/build/bundle-build-broker.proxy';
import { runShardLayerBrokerProxy } from './run-shard-layer-broker.proxy';
import { checkCommandsStatics } from '../../../statics/check-commands/check-commands-statics';
import { RunnerCommandStub } from '../../../contracts/runner-command/runner-command.stub';
import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';

// The sha-256 of the three files bundleBuildBrokerProxy's single-package fixture stages, in sorted
// path order relative to the package root. Editing any of those contents changes this number.
const BUNDLE_HASH = '1d36195dbed4d762ee44bad0c0a391b267a8b412c2832995e82a59b16fe9d184';

const DEFAULT_SHARD_PORT_PAIRS = [
  { server: 40_000, web: 51_244 },
  { server: 40_002, web: 51_246 },
  { server: 40_004, web: 51_248 },
] as const;

const THREE_SHARDS_DISCOVERED_FILES = ['spec1.e2e.ts', 'spec2.e2e.ts', 'spec3.e2e.ts'] as const;
const THREE_SHARDS_COUNT = 3;

export const checkRunE2eBrokerProxy = (): {
  setupPass: (params: { projectFolder: ProjectFolder }) => void;
  setupPassWithBundle: (params: { projectFolder: ProjectFolder }) => void;
  getBundleDir: (params: { projectFolder: ProjectFolder }) => string;
  setupPassWithOutput: (params: { projectFolder: ProjectFolder; stdout: string }) => void;
  setupPassWithJsonReport: (params: { projectFolder: ProjectFolder; jsonContent: string }) => void;
  setupFail: (params: { projectFolder: ProjectFolder; stdout: string }) => void;
  setupFailWithEmptyOutput: (params: { projectFolder: ProjectFolder }) => void;
  setupNotE2eEligible: (params: { projectFolder: ProjectFolder }) => void;
  setupEligibleMissingConfig: (params: { projectFolder: ProjectFolder }) => void;
  setupSourceConditionUnsupported: (params: { projectFolder: ProjectFolder }) => void;
  setupShardedPass: (params: {
    projectFolder: ProjectFolder;
    shardCount?: number;
    discoveredFiles?: readonly string[];
    shardOutputs?: readonly { stdout?: string; exitCode?: number }[];
    e2eSharding?: boolean;
  }) => void;
  getRemovedCachePaths: (params: { projectFolder: ProjectFolder }) => readonly unknown[][];
  getSpawnedArgs: () => unknown;
  getAllSpawnedArgs: () => readonly (readonly string[])[];
  getSpawnedCommandLine: () => unknown;
  getSpawnedEnvValue: (params: { key: string }) => unknown;
  getAllSpawnedEnvValues: (params: { key: string }) => readonly unknown[];
  getSpawnedOptions: () => unknown;
  getKilledPorts: () => readonly number[];
} => {
  const existsProxy = existsSyncProxy();
  const eligibleProxy = architecturePackageE2eEligibleDetectBrokerProxy();
  const globProxy = globDiscoverFilesBrokerProxy();
  globProxy.returnsForPattern({ pattern: '**/*.e2e.ts', files: ['discovered.ts'] });
  const runnerProxy = runnerCommandResolveBrokerProxy();
  const bundleProxy = bundleBuildBrokerProxy();
  const configProxy = configResolveBrokerProxy();
  const shardProxy = runShardLayerBrokerProxy();
  const runnerRef: { value: ReturnType<typeof RunnerCommandStub> } = { value: RunnerCommandStub() };
  const unsupportedCwds = new Set<string>();

  const stageConfig = ({
    projectFolder,
    e2eSharding = false,
  }: {
    projectFolder: ProjectFolder;
    e2eSharding?: boolean;
  }): void => {
    configProxy.setupResolves({
      filePath: `${projectFolder.path}/package.json`,
      config: DungeonmasterConfigStub({
        ward: {
          concurrency: 4,
          e2eSharding,
        },
      }),
    });
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
      path: `${projectFolder.path}/playwright.config.ts`,
      exists: true,
    });
  };

  const resolveRunner = ({
    projectFolder,
  }: {
    projectFolder: ProjectFolder;
  }): ReturnType<typeof RunnerCommandStub> => {
    const cwd = projectFolder.path;
    const binName = checkCommandsStatics.e2e.bin;
    const runner = unsupportedCwds.has(cwd)
      ? runnerProxy.setupBuiltRunner({ cwd, binName })
      : runnerProxy.setupSourceRunner({ cwd, binName });
    runnerRef.value = runner;
    return runner;
  };

  const bundleDirFor = ({ projectFolder }: { projectFolder: ProjectFolder }): string =>
    bundleProxy.bundleDirFor({
      packageRoot: projectFolder.path,
      hash: BUNDLE_HASH,
    });

  const stageCachedBundle = ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
    bundleProxy.setupCachedSinglePackageBundle({
      packageRoot: projectFolder.path,
      hash: BUNDLE_HASH,
    });
  };

  return {
    setupPass: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      stageConfig({ projectFolder, e2eSharding: false });
      setupPlaywrightConfigExists({ projectFolder });
      const runner = resolveRunner({ projectFolder });
      shardProxy.setupPass({ packagePath: projectFolder.path, command: runner.command });
    },

    setupPassWithBundle: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      stageConfig({ projectFolder, e2eSharding: false });
      setupPlaywrightConfigExists({ projectFolder });
      stageCachedBundle({ projectFolder });
      const runner = resolveRunner({ projectFolder });
      shardProxy.setupPass({ packagePath: projectFolder.path, command: runner.command });
    },

    getBundleDir: ({ projectFolder }: { projectFolder: ProjectFolder }): string =>
      bundleDirFor({ projectFolder }),

    setupPassWithOutput: ({
      projectFolder,
      stdout,
    }: {
      projectFolder: ProjectFolder;
      stdout: string;
    }): void => {
      stageConfig({ projectFolder, e2eSharding: false });
      setupPlaywrightConfigExists({ projectFolder });
      const runner = resolveRunner({ projectFolder });
      shardProxy.setupPass({ packagePath: projectFolder.path, command: runner.command, stdout });
    },

    setupPassWithJsonReport: ({
      projectFolder,
      jsonContent,
    }: {
      projectFolder: ProjectFolder;
      jsonContent: string;
    }): void => {
      stageConfig({ projectFolder, e2eSharding: false });
      setupPlaywrightConfigExists({ projectFolder });
      const runner = resolveRunner({ projectFolder });
      shardProxy.setupPassWithJsonReport({
        packagePath: projectFolder.path,
        command: runner.command,
        jsonContent,
      });
    },

    setupFail: ({
      projectFolder,
      stdout,
    }: {
      projectFolder: ProjectFolder;
      stdout: string;
    }): void => {
      stageConfig({ projectFolder, e2eSharding: false });
      setupPlaywrightConfigExists({ projectFolder });
      const runner = resolveRunner({ projectFolder });
      shardProxy.setupFail({ packagePath: projectFolder.path, command: runner.command, stdout });
    },

    setupFailWithEmptyOutput: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      stageConfig({ projectFolder, e2eSharding: false });
      setupPlaywrightConfigExists({ projectFolder });
      const runner = resolveRunner({ projectFolder });
      shardProxy.setupFail({
        packagePath: projectFolder.path,
        command: runner.command,
        stdout: '',
      });
    },

    setupNotE2eEligible: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      eligibleProxy.setupPackage({
        packageRoot: String(projectFolder.path),
        srcDirNames: ['brokers'],
      });
      existsProxy.returns({
        path: `${projectFolder.path}/playwright.config.ts`,
        exists: false,
      });
    },

    setupEligibleMissingConfig: ({ projectFolder }: { projectFolder: ProjectFolder }): void => {
      markEligible({ projectFolder });
      existsProxy.returns({
        path: `${projectFolder.path}/playwright.config.ts`,
        exists: false,
      });
    },

    setupSourceConditionUnsupported: ({
      projectFolder,
    }: {
      projectFolder: ProjectFolder;
    }): void => {
      unsupportedCwds.add(projectFolder.path);
    },

    setupShardedPass: ({
      projectFolder,
      shardCount = THREE_SHARDS_COUNT,
      discoveredFiles,
      shardOutputs,
      e2eSharding = true,
    }: {
      projectFolder: ProjectFolder;
      shardCount?: number;
      discoveredFiles?: readonly string[];
      shardOutputs?: readonly { stdout?: string; exitCode?: number }[];
      e2eSharding?: boolean;
    }): void => {
      stageConfig({ projectFolder, e2eSharding });
      setupPlaywrightConfigExists({ projectFolder });

      const defaultFiles =
        shardCount === THREE_SHARDS_COUNT ? [...THREE_SHARDS_DISCOVERED_FILES] : ['discovered.ts'];
      const files = discoveredFiles === undefined ? defaultFiles : [...discoveredFiles];
      globProxy.returnsForPattern({ pattern: '**/*.e2e.ts', files });

      const runner = resolveRunner({ projectFolder });
      const pairs = DEFAULT_SHARD_PORT_PAIRS.slice(0, shardCount);

      shardProxy.setupShardedRuns({
        shardCount,
        pairs,
        packagePath: projectFolder.path,
        command: runner.command,
        leadingArgs: runner.leadingArgs,
        ...(shardOutputs === undefined ? {} : { shardOutputs }),
      });
    },

    getRemovedCachePaths: ({
      projectFolder,
    }: {
      projectFolder: ProjectFolder;
    }): readonly unknown[][] =>
      shardProxy.getRemovedCachePaths({
        packageRoot: projectFolder.path,
      }),

    getSpawnedArgs: (): unknown =>
      shardProxy.getSpawnedArgs({
        command: runnerRef.value.command,
        leadingArgs: runnerRef.value.leadingArgs,
      }),

    getAllSpawnedArgs: (): readonly (readonly string[])[] =>
      shardProxy.getAllSpawnedArgs({
        command: runnerRef.value.command,
        leadingArgs: runnerRef.value.leadingArgs,
      }),

    getSpawnedCommandLine: (): unknown =>
      shardProxy.getSpawnedCommandLine({ command: runnerRef.value.command }),

    getSpawnedEnvValue: ({ key }: { key: string }): unknown =>
      shardProxy.getSpawnedEnv({ command: runnerRef.value.command })?.[key],

    getAllSpawnedEnvValues: ({ key }: { key: string }): readonly unknown[] =>
      shardProxy.getAllSpawnedEnvValues({ key, command: runnerRef.value.command }),

    getSpawnedOptions: (): unknown =>
      shardProxy.getSpawnedOptions({ command: runnerRef.value.command }),

    getKilledPorts: (): readonly number[] => shardProxy.getKilledPorts(),
  };
};
