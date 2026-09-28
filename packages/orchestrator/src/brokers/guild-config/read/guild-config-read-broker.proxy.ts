/**
 * PURPOSE: Proxy for guild-config-read-broker that mocks filesystem and path operations
 *
 * USAGE:
 * const proxy = guildConfigReadBrokerProxy();
 * proxy.setupConfig({ config: GuildConfigStub({ guilds: [] }) });
 */

import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub, type FilePath, type GuildConfig } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '#gateway/node/fs';
import { join } from '#gateway/node/path';

import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

const DEFAULT_HOME_DIR = '/home/user';
const DEFAULT_HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const DEFAULT_CONFIG_FILE_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });

export const guildConfigReadBrokerProxy = (): {
  setupConfig: (params: {
    config: GuildConfig;
    // A real process has one home. Omit these to get this proxy's own fixture home; pass the SAME
    // homeDir/homePath a sibling proxy composed in the same test staged (e.g.
    // questFindQuestPathBrokerProxy's own setupQuestFound) when that sibling's real resolution also
    // has to run through this one process's dungeonmasterHomeFindBroker() — the mock is shared and
    // address-less, so the LAST setupHomePath call in a test wins for every composed proxy.
    homeDir?: string;
    homePath?: FilePath;
  }) => void;
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
    error: FsError;
  }) => void;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports.
  const joinHandle: MockHandle = registerMock({ fn: join });
  const readFileHandle = readFileIfExistsProxy();

  return {
    setupConfig: ({
      config,
      homeDir = DEFAULT_HOME_DIR,
      homePath = DEFAULT_HOME_PATH,
    }: {
      config: GuildConfig;
      homeDir?: string;
      homePath?: FilePath;
    }): void => {
      const configFilePath =
        homePath === DEFAULT_HOME_PATH
          ? DEFAULT_CONFIG_FILE_PATH
          : FilePathStub({ value: `${String(homePath)}/config.json` });
      homeFindProxy.setupHomePath({ homeDir, homePath });
      joinHandle
        .calledWith([homePath, dungeonmasterHomeStatics.paths.configFile])
        .returns(configFilePath);
      readFileHandle.returns({ path: configFilePath, contents: JSON.stringify(config) });
    },

    // For a caller-supplied home: stages the READ alone, at the exact config path, and stages
    // nothing on `dungeonmasterHomeFindBroker` or `join`. `dungeonmasterHomeFindBrokerProxy`'s own
    // constructor already stages a real-passthrough default on this SAME shared `join` handle, so
    // the path the broker computes off the supplied home is the genuine one — which is what lets a
    // test assert that path instead of a staged stand-in, and what makes a broker that fell back to
    // the process-wide home read a DIFFERENT path and throw on an unmatched call.
    setupConfigAt: ({
      configFilePath,
      config,
    }: {
      configFilePath: FilePath;
      config: GuildConfig;
    }): void => {
      readFileHandle.returns({ path: configFilePath, contents: JSON.stringify(config) });
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
      joinHandle
        .calledWith([homePath, dungeonmasterHomeStatics.paths.configFile])
        .returns(configFilePath);
      readFileHandle.returns({ path: configFilePath, contents: configJson });
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
      joinHandle
        .calledWith([homePath, dungeonmasterHomeStatics.paths.configFile])
        .returns(configFilePath);
      readFileHandle.missing({ path: configFilePath });
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
      error: FsError;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir, homePath });
      joinHandle
        .calledWith([homePath, dungeonmasterHomeStatics.paths.configFile])
        .returns(configFilePath);
      readFileHandle.throwsMatchingPath({ path: configFilePath, error });
    },
  };
};
