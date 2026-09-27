import { fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { locationsRegistryPathFindBrokerProxy } from '../../locations/registry-path-find/locations-registry-path-find-broker.proxy';

const REGISTRY_PATH_VALUE = '/home/user/.dungeonmaster/siegelense/registry.json';
const registryPath = FilePathStub({ value: REGISTRY_PATH_VALUE });
const registryPathAbs = AbsoluteFilePathStub({ value: REGISTRY_PATH_VALUE });

export const registryReadBrokerProxy = (): {
  setupMissingRegistry: () => void;
  setupPresentRegistry: (params: { content: string }) => void;
  setupReadFailure: (params: { error: Error }) => void;
  // Forwards to locationsRegistryPathFindBrokerProxy's own addressed-only home stage — for a
  // caller composed alongside another real-path.join-making resolver (instanceKillBrokerProxy's
  // convention), which cannot risk this file's own setupMissingRegistry/setupPresentRegistry/
  // setupReadFailure — each queues a one-shot outer join via queuePath().
  setupHomeOnly: (params: { homeDir: string; homePath: FilePath }) => void;
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

    setupHomeOnly: (params: { homeDir: string; homePath: FilePath }): void => {
      pathProxy.setupHomeOnly(params);
    },
  };
};
