/**
 * PURPOSE: Proxy for guild-config-write-broker that mocks filesystem and path operations
 *
 * USAGE:
 * const proxy = guildConfigWriteBrokerProxy();
 * proxy.setupWriteSuccess({ homeDir: '/home/user', homePath, configFilePath });
 */

import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/brokers/dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { FilePathStub } from '@dungeonmaster/shared/contracts/file-path/file-path.stub';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { join } from '#gateway/node/path';

const DEFAULT_HOME_DIR = '/home/user';
const DEFAULT_HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const DEFAULT_CONFIG_FILE_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });

export const guildConfigWriteBrokerProxy = (): {
  setupSuccess: () => void;
  setupSuccessAt: (params: { configFilePath: FilePath }) => void;
  getWrittenAt: (params: { configFilePath: FilePath }) => unknown;
  configFilesWritten: () => readonly unknown[];
  setupWriteSuccess: (params: {
    homeDir: string;
    homePath: FilePath;
    configFilePath: FilePath;
  }) => void;
  setupWriteFailure: (params: {
    homeDir: string;
    homePath: FilePath;
    configFilePath: FilePath;
    error: Error;
  }) => void;
  getWrittenContent: () => unknown;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports.
  const joinHandle: MockHandle = registerMock({ fn: join });
  const writeHandle = writeFileProxy();
  // Every config path this proxy staged a write for: `configFilesWritten` reads back the calls at
  // exactly those addresses.
  const stagedConfigPaths: FilePath[] = [];
  const stageStagedConfigPaths = (entry: FilePath): void => {
    if (!stagedConfigPaths.includes(entry)) {
      stagedConfigPaths.push(entry);
    }
  };

  return {
    setupSuccess: (): void => {
      homeFindProxy.setupHomePath({
        homeDir: DEFAULT_HOME_DIR,
        homePath: DEFAULT_HOME_PATH,
      });
      joinHandle
        .calledWith([DEFAULT_HOME_PATH, dungeonmasterHomeStatics.paths.configFile])
        .returns(DEFAULT_CONFIG_FILE_PATH);
      stageStagedConfigPaths(DEFAULT_CONFIG_FILE_PATH);
      writeHandle.succeeds({ path: DEFAULT_CONFIG_FILE_PATH });
    },

    // For a caller-supplied home: stages the WRITE alone, at the exact config path, and stages
    // nothing on `dungeonmasterHomeFindBroker` or `join`. `dungeonmasterHomeFindBrokerProxy`'s own
    // constructor already stages a real-passthrough default on this SAME shared `join` handle, so
    // the path the broker computes off the supplied home is the genuine one — and a broker falling
    // back to the process-wide home would write a DIFFERENT path and throw on an unmatched call.
    setupSuccessAt: ({ configFilePath }: { configFilePath: FilePath }): void => {
      stageStagedConfigPaths(configFilePath);
      writeHandle.succeeds({ path: configFilePath });
    },

    // The body written to ONE named config path — the counterpart to `getWrittenContent` below,
    // which is pinned to the default home's path.
    getWrittenAt: ({ configFilePath }: { configFilePath: FilePath }): unknown =>
      writeHandle.writtenContentsFor({ path: configFilePath }),

    // Every staged config path this broker wrote to, in staging order. Assert an escape against
    // this — a path list is an observation, where "the supplied path was staged" is not. A write to
    // any path nobody staged throws instead of landing here.
    configFilesWritten: (): readonly unknown[] =>
      stagedConfigPaths.flatMap((configFilePath) =>
        writeHandle.getCallsFor({ path: configFilePath }).map((call) => call[0]),
      ),

    setupWriteSuccess: ({
      homeDir,
      homePath,
      configFilePath,
    }: {
      homeDir: string;
      homePath: FilePath;
      configFilePath: FilePath;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      joinHandle
        .calledWith([homePath, dungeonmasterHomeStatics.paths.configFile])
        .returns(configFilePath);
      stageStagedConfigPaths(configFilePath);
      writeHandle.succeeds({ path: configFilePath });
    },

    setupWriteFailure: ({
      homeDir,
      homePath,
      configFilePath,
      error,
    }: {
      homeDir: string;
      homePath: FilePath;
      configFilePath: FilePath;
      error: Error;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      joinHandle
        .calledWith([homePath, dungeonmasterHomeStatics.paths.configFile])
        .returns(configFilePath);
      stageStagedConfigPaths(configFilePath);
      writeHandle.rejects({
        path: configFilePath,
        error: Object.assign(error, { code: 'EIO' }),
      });
    },

    // Every caller of this proxy's setup methods (default and explicit) uses the same
    // literal config.json path, so the write's address is this fixed constant.
    getWrittenContent: (): unknown =>
      writeHandle.writtenContentsFor({ path: DEFAULT_CONFIG_FILE_PATH }),
  };
};
