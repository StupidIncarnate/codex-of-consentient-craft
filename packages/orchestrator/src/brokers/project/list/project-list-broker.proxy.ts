import {
  dungeonmasterHomeFindBrokerProxy,
  fsReaddirWithTypesAdapterProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath, ProjectConfig } from '@dungeonmaster/shared/contracts';
import type { Dirent } from 'fs';

import { pathIsAccessibleBrokerProxy } from '../../path/is-accessible/path-is-accessible-broker.proxy';
import { projectConfigReadBrokerProxy } from '../../project-config/read/project-config-read-broker.proxy';

export const projectListBrokerProxy = (): {
  setupProjectList: (params: {
    config: ProjectConfig;
    homeDir: string;
    homePath: FilePath;
    projectEntries: {
      accessible: boolean;
      questsDirPath: FilePath;
      questDirEntries: Dirent[];
    }[];
  }) => void;
  setupEmptyConfig: (params: { homeDir: string; homePath: FilePath }) => void;
} => {
  const configReadProxy = projectConfigReadBrokerProxy();
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const readdirProxy = fsReaddirWithTypesAdapterProxy();
  const accessibleProxy = pathIsAccessibleBrokerProxy();

  return {
    setupProjectList: ({
      config,
      homeDir,
      homePath,
      projectEntries,
    }: {
      config: ProjectConfig;
      homeDir: string;
      homePath: FilePath;
      projectEntries: {
        accessible: boolean;
        questsDirPath: FilePath;
        questDirEntries: Dirent[];
      }[];
    }): void => {
      configReadProxy.setupConfig({ config });
      homeFindProxy.setupHomePath({ homeDir, homePath });

      for (const entry of projectEntries) {
        accessibleProxy.setupResult({ result: entry.accessible });
        pathJoinProxy.returns({ result: entry.questsDirPath });
        readdirProxy.returns({ entries: entry.questDirEntries });
      }
    },

    setupEmptyConfig: ({ homeDir, homePath }: { homeDir: string; homePath: FilePath }): void => {
      configReadProxy.setupConfig({ config: { projects: [] } });
      homeFindProxy.setupHomePath({ homeDir, homePath });
    },
  };
};
