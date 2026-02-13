import {
  dungeonmasterHomeEnsureBrokerProxy,
  fsMkdirAdapterProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath, ProjectConfig } from '@dungeonmaster/shared/contracts';

import { projectConfigReadBrokerProxy } from '../../project-config/read/project-config-read-broker.proxy';
import { projectConfigWriteBrokerProxy } from '../../project-config/write/project-config-write-broker.proxy';

export const projectAddBrokerProxy = (): {
  setupAddProject: (params: {
    existingConfig: ProjectConfig;
    homeDir: string;
    homePath: FilePath;
    projectsPath: FilePath;
    projectDirPath: FilePath;
    questsDirPath: FilePath;
  }) => void;
  setupDuplicatePath: (params: { existingConfig: ProjectConfig }) => void;
} => {
  const configReadProxy = projectConfigReadBrokerProxy();
  const configWriteProxy = projectConfigWriteBrokerProxy();
  const homeEnsureProxy = dungeonmasterHomeEnsureBrokerProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  jest.spyOn(crypto, 'randomUUID').mockReturnValue('f47ac10b-58cc-4372-a567-0e02b2c3d479');
  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');

  return {
    setupAddProject: ({
      existingConfig,
      homeDir,
      homePath,
      projectsPath,
      projectDirPath,
      questsDirPath,
    }: {
      existingConfig: ProjectConfig;
      homeDir: string;
      homePath: FilePath;
      projectsPath: FilePath;
      projectDirPath: FilePath;
      questsDirPath: FilePath;
    }): void => {
      configReadProxy.setupConfig({ config: existingConfig });
      homeEnsureProxy.setupEnsureSuccess({ homeDir, homePath, projectsPath });
      pathJoinProxy.returns({ result: projectDirPath });
      pathJoinProxy.returns({ result: questsDirPath });
      mkdirProxy.succeeds({ filepath: questsDirPath });
      configWriteProxy.setupSuccess();
    },

    setupDuplicatePath: ({ existingConfig }: { existingConfig: ProjectConfig }): void => {
      configReadProxy.setupConfig({ config: existingConfig });
    },
  };
};
