import { filePathContract } from '@dungeonmaster/shared/contracts';

import type { ProjectFolder } from '../../../contracts/project-folder/project-folder-contract';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const gatewayDependencyNamesReadLayerBrokerProxy = (): {
  setupPackageJson: (params: {
    folder: ProjectFolder;
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  }) => void;
} => {
  const fsProxy = fsReadFileAdapterProxy();

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
      fsProxy.returns({
        filePath: filePathContract.parse(`${folder.path}/package.json`),
        content: JSON.stringify({ name: folder.name, dependencies, peerDependencies }),
      });
    },
  };
};
