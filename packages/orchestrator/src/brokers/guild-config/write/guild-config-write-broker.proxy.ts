/**
 * PURPOSE: Proxy for guild-config-write-broker that mocks filesystem and path operations
 *
 * USAGE:
 * const proxy = guildConfigWriteBrokerProxy();
 * proxy.setupWriteSuccess({ homeDir: '/home/user', homePath, configFilePath });
 */

import {
  dungeonmasterHomeFindBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { FilePathStub, type FilePath } from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

const DEFAULT_HOME_DIR = '/home/user';
const DEFAULT_HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const DEFAULT_CONFIG_FILE_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });

export const guildConfigWriteBrokerProxy = (): {
  setupSuccess: () => void;
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
  const pathJoinProxy = pathJoinAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();

  return {
    setupSuccess: (): void => {
      homeFindProxy.setupHomePath({
        homeDir: DEFAULT_HOME_DIR,
        homePath: DEFAULT_HOME_PATH,
      });
      pathJoinProxy.returns({ result: DEFAULT_CONFIG_FILE_PATH });
      writeFileProxy.succeeds({ filePath: DEFAULT_CONFIG_FILE_PATH });
    },

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
      pathJoinProxy.returns({ result: configFilePath });
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
      pathJoinProxy.returns({ result: configFilePath });
      writeFileProxy.throws({ filePath: configFilePath, error });
    },

    // Every caller of this proxy's setup methods (default and explicit) uses the same
    // literal config.json path, so the write's address is this fixed constant.
    getWrittenContent: (): unknown =>
      writeFileProxy.getWrittenFor({ filePath: DEFAULT_CONFIG_FILE_PATH }),
  };
};
