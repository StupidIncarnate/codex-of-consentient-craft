import { join } from '#gateway/node/path';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { AbsoluteFilePathStub, FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { locationsRegistryPathFindBrokerProxy } from '../../locations/registry-path-find/locations-registry-path-find-broker.proxy';
import { locationsRootPathFindBrokerProxy } from '../../locations/root-path-find/locations-root-path-find-broker.proxy';

const HOME_DIR = '/home/user';
const HOME_PATH_VALUE = '/home/user/.dungeonmaster';
const ROOT_PATH_VALUE = '/home/user/.dungeonmaster/siegelense';
const REGISTRY_PATH_VALUE = '/home/user/.dungeonmaster/siegelense/registry.json';
const TMP_PATH_VALUE = '/home/user/.dungeonmaster/siegelense/registry.json.tmp';

const homePath = FilePathStub({ value: HOME_PATH_VALUE });
const rootPath = FilePathStub({ value: ROOT_PATH_VALUE });
const registryPath = FilePathStub({ value: REGISTRY_PATH_VALUE });
const tmpPath = FilePathStub({ value: TMP_PATH_VALUE });
const tmpPathAbs = AbsoluteFilePathStub({ value: TMP_PATH_VALUE });

export const registryWriteBrokerProxy = (): {
  setupWriteSuccess: () => void;
  setupWriteFailure: (params: { error: Error }) => void;
  getWrittenPath: () => unknown;
  getWrittenContent: () => unknown;
  getRenamedFrom: () => unknown;
  getRenamedTo: () => unknown;
} => {
  // registryWriteBroker calls locationsRootPathFindBroker() directly (for ensureDir + the tmp-path
  // join), then locationsRegistryPathFindBroker() (which recomputes the root path internally on
  // its way to the live path) — so the root-path resolution is staged TWICE, in that order,
  // matching the broker's real call sequence.
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const registryPathProxy = locationsRegistryPathFindBrokerProxy();
  // Shares the same '#gateway/node/path' join handle rootPathProxy's own constructor registers
  // (transitively, via dungeonmasterHomeFindBrokerProxy) — addressed here on this file's OWN exact
  // tuple, never a bare `calledWith([])`.
  const joinHandle = registerMock({ fn: join });
  const ensureDirHandle = ensureDirProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const renameProxy = fsRenameAdapterProxy();

  const queuePaths = (): void => {
    rootPathProxy.setupRootPath({ homeDir: HOME_DIR, homePath, rootPath });
    registryPathProxy.setupRegistryPath({ homeDir: HOME_DIR, homePath, rootPath, registryPath });
    joinHandle.calledWith([rootPath, locationsStatics.siegelense.registryTmp]).returns(tmpPath);
    ensureDirHandle.succeeds({ path: rootPath });
  };

  return {
    setupWriteSuccess: (): void => {
      queuePaths();
      writeProxy.succeeds({ filePath: tmpPathAbs });
      renameProxy.succeeds({ fromPath: tmpPathAbs });
    },

    setupWriteFailure: ({ error }: { error: Error }): void => {
      queuePaths();
      writeProxy.throws({ filePath: tmpPathAbs, error });
    },

    getWrittenPath: (): unknown => TMP_PATH_VALUE,

    getWrittenContent: (): unknown => writeProxy.getWrittenFor({ filePath: tmpPathAbs }),

    getRenamedFrom: (): unknown => TMP_PATH_VALUE,

    getRenamedTo: (): unknown => renameProxy.getToPathFor({ fromPath: tmpPathAbs }),
  };
};
