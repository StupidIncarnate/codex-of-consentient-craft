import type { Dirent } from '#gateway/node/fs';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { findStartupFilesLayerBrokerProxy } from './find-startup-files-layer-broker.proxy';
import { readSourceTextLayerBrokerProxy } from './read-source-text-layer-broker.proxy';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';

export const walkReachableFilesLayerBrokerProxy = (): {
  setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }) => void;
  setupReadFileImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }) => void;
  setupExistsImplementation: ({ fn }: { fn: (filePath: string) => boolean }) => void;
} => {
  const startupProxy = findStartupFilesLayerBrokerProxy();
  const sourceProxy = readSourceTextLayerBrokerProxy();
  const existsProxy = existsSyncProxy();

  return {
    setupReaddirImplementation: ({ fn }: { fn: (dirPath: string) => Dirent[] }): void => {
      startupProxy.setupReaddirImplementation({ fn });
    },
    setupReadFileImplementation: ({ fn }: { fn: (filePath: ContentText) => ContentText }): void => {
      sourceProxy.setupImplementation({ fn });
    },
    // Two mutually exclusive predicates, not a raw registerMock: there is no single known path
    // to key on (the resolved ts/tsx candidate comes from relativeImportResolveTransformer), and
    // `fn`/`!fn` partition every call between the two registrations, so `returnsMatchingPath`
    // alone answers the caller's per-path lookup with no tie for staging order to break.
    setupExistsImplementation: ({ fn }: { fn: (filePath: string) => boolean }): void => {
      existsProxy.returnsMatchingPath({
        path: (value): boolean => fn(String(value)),
        exists: true,
      });
      existsProxy.returnsMatchingPath({
        path: (value): boolean => !fn(String(value)),
        exists: false,
      });
    },
  };
};
