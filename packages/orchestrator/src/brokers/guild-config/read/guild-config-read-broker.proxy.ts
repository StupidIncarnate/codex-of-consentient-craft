/**
 * PURPOSE: Proxy for guild-config-read-broker that mocks filesystem and path operations
 *
 * USAGE:
 * const proxy = guildConfigReadBrokerProxy();
 * proxy.setupConfig({ config: GuildConfigStub({ guilds: [] }) });
 */

import {
  dungeonmasterHomeFindBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { FilePathStub, type FilePath, type GuildConfig } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

const DEFAULT_HOME_DIR = '/home/user';
const DEFAULT_HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const DEFAULT_CONFIG_FILE_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });

export const guildConfigReadBrokerProxy = (): {
  setupConfig: (params: { config: GuildConfig }) => void;
  setupConfigAt: (params: { configFilePath: FilePath; config: GuildConfig }) => void;
  setupConfigExists: (params: {
    homeDir: string;
    homePath: FilePath;
    configFilePath: FilePath;
    configJson: string;
  }) => void;
  setupConfigMissing: (params: {
    homeDir: string;
    homePath: FilePath;
    configFilePath: FilePath;
  }) => void;
  setupReadError: (params: {
    homeDir: string;
    homePath: FilePath;
    configFilePath: FilePath;
    error: Error;
  }) => void;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupConfig: ({ config }: { config: GuildConfig }): void => {
      homeFindProxy.setupHomePath({
        homeDir: DEFAULT_HOME_DIR,
        homePath: DEFAULT_HOME_PATH,
      });
      pathJoinProxy.returns({ result: DEFAULT_CONFIG_FILE_PATH });
      readFileProxy.resolves({
        filePath: DEFAULT_CONFIG_FILE_PATH,
        content: JSON.stringify(config),
      });
    },

    // For a caller-supplied home: stages the READ alone, at the exact config path, and stages
    // nothing on `dungeonmasterHomeFindBroker` or `pathJoinAdapter`. `pathJoinAdapterProxy`'s own
    // default is a real passthrough, so the path the broker computes off the supplied home is the
    // genuine one — which is what lets a test assert that path instead of a staged stand-in, and
    // what makes a broker that fell back to the process-wide home read a DIFFERENT path and throw
    // on an unmatched call.
    setupConfigAt: ({
      configFilePath,
      config,
    }: {
      configFilePath: FilePath;
      config: GuildConfig;
    }): void => {
      readFileProxy.resolves({ filePath: configFilePath, content: JSON.stringify(config) });
    },

    setupConfigExists: ({
      homeDir,
      homePath,
      configFilePath,
      configJson,
    }: {
      homeDir: string;
      homePath: FilePath;
      configFilePath: FilePath;
      configJson: string;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      pathJoinProxy.returns({ result: configFilePath });
      readFileProxy.resolves({ filePath: configFilePath, content: configJson });
    },

    setupConfigMissing: ({
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
      const enoentCause = Object.assign(new Error('ENOENT: no such file or directory'), {
        code: 'ENOENT',
      });
      readFileProxy.rejects({
        filePath: configFilePath,
        error: enoentCause,
      });
    },

    setupReadError: ({
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
      readFileProxy.rejects({ filePath: configFilePath, error });
    },
  };
};
