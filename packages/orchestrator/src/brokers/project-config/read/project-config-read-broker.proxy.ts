/**
 * PURPOSE: Proxy for project-config-read-broker that mocks filesystem and path operations
 *
 * USAGE:
 * const proxy = projectConfigReadBrokerProxy();
 * proxy.setupConfig({ config: ProjectConfigStub({ projects: [] }) });
 */

import {
  dungeonmasterHomeFindBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { FilePathStub, type FilePath, type ProjectConfig } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

const DEFAULT_HOME_DIR = '/home/user';
const DEFAULT_HOME_PATH = FilePathStub({ value: '/home/user/.dungeonmaster' });
const DEFAULT_CONFIG_FILE_PATH = FilePathStub({ value: '/home/user/.dungeonmaster/config.json' });

export const projectConfigReadBrokerProxy = (): {
  setupConfig: (params: { config: ProjectConfig }) => void;
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
    setupConfig: ({ config }: { config: ProjectConfig }): void => {
      homeFindProxy.setupHomePath({
        homeDir: DEFAULT_HOME_DIR,
        homePath: DEFAULT_HOME_PATH,
      });
      pathJoinProxy.returns({ result: DEFAULT_CONFIG_FILE_PATH });
      readFileProxy.resolves({ content: JSON.stringify(config) });
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
      readFileProxy.resolves({ content: configJson });
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
      readFileProxy.rejects({ error });
    },
  };
};
