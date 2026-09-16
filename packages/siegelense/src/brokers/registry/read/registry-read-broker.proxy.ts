import { fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { locationsRegistryPathFindBrokerProxy } from '../../locations/registry-path-find/locations-registry-path-find-broker.proxy';

const REGISTRY_PATH_VALUE = '/home/user/.dungeonmaster/siegelense/registry.json';
const registryPath = FilePathStub({ value: REGISTRY_PATH_VALUE });
const registryPathAbs = AbsoluteFilePathStub({ value: REGISTRY_PATH_VALUE });

export const registryReadBrokerProxy = (): {
  setupMissingRegistry: () => void;
  setupPresentRegistry: (params: { content: string }) => void;
  setupReadFailure: (params: { error: Error }) => void;
} => {
  const pathProxy = locationsRegistryPathFindBrokerProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  const queuePath = (): void => {
    pathProxy.setupRegistryPath({
      homeDir: '/home/user',
      homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      rootPath: FilePathStub({ value: '/home/user/.dungeonmaster/siegelense' }),
      registryPath,
    });
  };

  return {
    setupMissingRegistry: (): void => {
      queuePath();
      existsProxy.returns({ filePath: registryPath, result: false });
    },

    setupPresentRegistry: ({ content }: { content: string }): void => {
      queuePath();
      existsProxy.returns({ filePath: registryPath, result: true });
      readFileProxy.resolves({ filePath: registryPathAbs, content });
    },

    setupReadFailure: ({ error }: { error: Error }): void => {
      queuePath();
      existsProxy.returns({ filePath: registryPath, result: true });
      readFileProxy.rejects({ filePath: registryPathAbs, error });
    },
  };
};
