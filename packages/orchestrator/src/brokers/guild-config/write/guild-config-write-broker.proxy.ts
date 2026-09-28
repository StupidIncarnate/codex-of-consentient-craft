/**
 * PURPOSE: Proxy for guild-config-write-broker that mocks filesystem and path operations
 *
 * USAGE:
 * const proxy = guildConfigWriteBrokerProxy();
 * proxy.setupWriteSuccess({ homeDir: '/home/user', homePath, configFilePath });
 */

import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub, type FilePath } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { join } from '#gateway/node/path';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

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
  const writeFileProxy = fsWriteFileAdapterProxy();

  return {
    setupSuccess: (): void => {
      homeFindProxy.setupHomePath({
        homeDir: DEFAULT_HOME_DIR,
        homePath: DEFAULT_HOME_PATH,
      });
      joinHandle
        .calledWith([DEFAULT_HOME_PATH, dungeonmasterHomeStatics.paths.configFile])
        .returns(DEFAULT_CONFIG_FILE_PATH);
      writeFileProxy.succeeds({ filePath: DEFAULT_CONFIG_FILE_PATH });
    },

    // For a caller-supplied home: stages the WRITE alone, at the exact config path, and stages
    // nothing on `dungeonmasterHomeFindBroker` or `join`. `dungeonmasterHomeFindBrokerProxy`'s own
    // constructor already stages a real-passthrough default on this SAME shared `join` handle, so
    // the path the broker computes off the supplied home is the genuine one — and a broker falling
    // back to the process-wide home would write a DIFFERENT path and throw on an unmatched call.
    setupSuccessAt: ({ configFilePath }: { configFilePath: FilePath }): void => {
      writeFileProxy.succeeds({ filePath: configFilePath });
    },

    // The body written to ONE named config path — the counterpart to `getWrittenContent` below,
    // which is pinned to the default home's path.
    getWrittenAt: ({ configFilePath }: { configFilePath: FilePath }): unknown =>
      writeFileProxy.getWrittenFor({ filePath: configFilePath }),

    // Every path this broker handed to `fsWriteFileAdapter`, in call order. Assert an escape
    // against this — a path list is an observation, where "the supplied path was staged" is not.
    configFilesWritten: (): readonly unknown[] =>
      writeFileProxy.getAllWrittenFiles().map((written) => written.path),

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
      writeFileProxy.succeeds({ filePath: configFilePath });
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
      writeFileProxy.throws({ filePath: configFilePath, error });
    },

    // Every caller of this proxy's setup methods (default and explicit) uses the same
    // literal config.json path, so the write's address is this fixed constant.
    getWrittenContent: (): unknown =>
      writeFileProxy.getWrittenFor({ filePath: DEFAULT_CONFIG_FILE_PATH }),
  };
};
