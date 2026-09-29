import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import type { FsError } from '#gateway/node/fs';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { locationsRegistryPathFindBrokerProxy } from '../../locations/registry-path-find/locations-registry-path-find-broker.proxy';

const REGISTRY_PATH_VALUE = '/home/user/.dungeonmaster/siegelense/registry.json';
const registryPath = FilePathStub({ value: REGISTRY_PATH_VALUE });

export const registryReadBrokerProxy = (): {
  setupMissingRegistry: () => void;
  setupPresentRegistry: (params: { content: string }) => void;
  // One-shot: answers exactly one read with this content, ahead of the sticky `setupPresentRegistry`
  // answer, so a caller whose first reads happen before a row is added (a reservation's own) sees
  // the registry without it while later reads see the sticky one. Queue it once per read.
  setupPresentRegistryOnce: (params: { content: string }) => void;
  setupReadFailure: (params: { error: Error }) => void;
  // Forwards to locationsRegistryPathFindBrokerProxy's own addressed-only home stage — for a
  // caller composed alongside another real-path.join-making resolver (instanceRunBrokerProxy's
  // convention), which cannot risk this file's own setupMissingRegistry/setupPresentRegistry/
  // setupReadFailure — each also stages exists/read for a specific registryPath this proxy
  // computes, which such a caller wants to control independently.
  setupHomeOnly: (params: { homeDir: string; homePath: FilePath }) => void;
} => {
  const pathProxy = locationsRegistryPathFindBrokerProxy();
  const existsProxy = existsSyncProxy();
  const readProxy = readFileProxy();

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
      existsProxy.returns({ path: registryPath, exists: false });
    },

    setupPresentRegistry: ({ content }: { content: string }): void => {
      queuePath();
      existsProxy.returns({ path: registryPath, exists: true });
      readProxy.returns({ path: registryPath, contents: content });
    },

    setupPresentRegistryOnce: ({ content }: { content: string }): void => {
      queuePath();
      existsProxy.returns({ path: registryPath, exists: true });
      readProxy.returnsOnce({ path: registryPath, contents: content });
    },

    setupReadFailure: ({ error }: { error: Error }): void => {
      queuePath();
      existsProxy.returns({ path: registryPath, exists: true });
      readProxy.throwsMatchingPath({ path: registryPath, error: error as FsError });
    },

    setupHomeOnly: (params: { homeDir: string; homePath: FilePath }): void => {
      pathProxy.setupHomeOnly(params);
    },
  };
};
