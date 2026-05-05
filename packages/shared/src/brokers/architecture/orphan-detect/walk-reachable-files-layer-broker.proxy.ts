import type { Dirent } from 'fs';
import { findStartupFilesLayerBrokerProxy } from './find-startup-files-layer-broker.proxy';
import { readSourceTextLayerBrokerProxy } from './read-source-text-layer-broker.proxy';
import { fsExistsSyncAdapterProxy } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const walkReachableFilesLayerBrokerProxy = (): {
  setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
  setupReadFileImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
  setupExistsImplementation: ({ fn }: { fn: (filePath: string) => boolean }) => void;
} => {
  const startupProxy = findStartupFilesLayerBrokerProxy();
  const sourceProxy = readSourceTextLayerBrokerProxy();
  const existsProxy = fsExistsSyncAdapterProxy();

  return {
    setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      startupProxy.setupReaddirImplementation({ fn });
    },
    setupReadFileImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      sourceProxy.setupImplementation({ fn });
    },
    setupExistsImplementation: ({ fn }: { fn: (filePath: string) => boolean }): void => {
      existsProxy.implementation({ fn: (input) => fn(String(input)) });
    },
  };
};
