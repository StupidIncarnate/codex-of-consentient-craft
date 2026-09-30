import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';

export const gatewayDependencyNamesReadLayerBrokerProxy = (): {
  setupPackageJson: (params: {
    folder: ProjectFolder;
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  }) => void;
} => {
  const readProxy = readFileProxy();

  return {
    setupPackageJson: ({
      folder,
      dependencies,
      peerDependencies,
    }: {
      folder: ProjectFolder;
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    }): void => {
      readProxy.returns({
        path: `${folder.path}/package.json`,
        contents: JSON.stringify({ name: folder.name, dependencies, peerDependencies }),
      });
    },
  };
};
