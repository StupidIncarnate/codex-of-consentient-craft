import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import { rmSyncProxy } from '#gateway/node/fs/rm-sync/rm-sync.proxy';
import type { runProxy } from '#gateway/node/child_process/run/run.proxy';

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { workspaceDiscoverBrokerProxy } from '../../workspace/discover/workspace-discover-broker.proxy';
import { scanConfigWriteBrokerProxy } from '../config-write/scan-config-write-broker.proxy';
import { scanPackageBrokerProxy } from '../package/scan-package-broker.proxy';

export const scanRunBrokerProxy = (): {
  setupWorkspaces: (params: { dirs: string[]; packageNames: string[] }) => void;
  setupNoWorkspaces: () => void;
  setupPackageExit: (params: {
    projectFolder: ProjectFolder;
    exitCode: number;
    stdout: string;
  }) => void;
  getEslintArgs: (params: {
    projectFolder: ProjectFolder;
  }) => ReturnType<ReturnType<typeof runProxy>['getCallsFor']>;
  getConfigRemovals: () => ReturnType<ReturnType<typeof rmSyncProxy>['calls']>;
} => {
  const discoverProxy = workspaceDiscoverBrokerProxy();
  const scanProxy = scanPackageBrokerProxy();
  const configProxy = scanConfigWriteBrokerProxy();
  const rmProxy = rmSyncProxy();

  // Every scan here runs against rootPath '/project' and writes its wrapper into this directory.
  const rootPath = AbsoluteFilePathStub({ value: '/project' });
  const configDirectory = '/tmp/ward-scan-abc123';
  configProxy.setupTempDir({ directory: configDirectory });
  rmProxy.succeeds({ path: configDirectory });

  return {
    setupWorkspaces: ({ dirs, packageNames }): void => {
      discoverProxy.setupMultiPackage({ patterns: ['packages/*'], dirs, packageNames });
    },

    setupNoWorkspaces: (): void => {
      discoverProxy.setupSinglePackage();
    },

    setupPackageExit: ({ projectFolder, exitCode, stdout }): void => {
      scanProxy.setupExit({ projectFolder, rootPath, exitCode, stdout, stderr: '' });
    },

    getEslintArgs: ({ projectFolder }): ReturnType<ReturnType<typeof runProxy>['getCallsFor']> =>
      scanProxy.getEslintArgs({ projectFolder }),

    getConfigRemovals: (): ReturnType<ReturnType<typeof rmSyncProxy>['calls']> =>
      rmProxy.calls({ path: configDirectory }),
  };
};
