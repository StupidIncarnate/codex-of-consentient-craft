import type { Dirent } from 'fs';
import { listWalkedFolderFilesLayerBrokerProxy } from './list-walked-folder-files-layer-broker.proxy';
import { walkReachableFilesLayerBrokerProxy } from './walk-reachable-files-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const architectureOrphanDetectBrokerProxy = (): {
  setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
  setupReadFileImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
  setupExistsImplementation: ({ fn }: { fn: (filePath: string) => boolean }) => void;
} => {
  const listProxy = listWalkedFolderFilesLayerBrokerProxy();
  const walkProxy = walkReachableFilesLayerBrokerProxy();

  return {
    setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      // Both child layer brokers walk filesystem via fsReaddirWithTypesAdapter.
      listProxy.implementation({ fn });
      walkProxy.setupReaddirImplementation({ fn });
    },
    setupReadFileImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      walkProxy.setupReadFileImplementation({ fn });
    },
    setupExistsImplementation: ({ fn }: { fn: (filePath: string) => boolean }): void => {
      walkProxy.setupExistsImplementation({ fn });
    },
  };
};
