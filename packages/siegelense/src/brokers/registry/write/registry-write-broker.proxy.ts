import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
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
  // registryWriteBroker calls locationsRootPathFindBroker() directly (for mkdir + the tmp-path
  // join), then locationsRegistryPathFindBroker() (which recomputes the root path internally on
  // its way to the live path) — so the root-path resolution is staged TWICE, in that order,
  // matching the broker's real call sequence.
  const rootPathProxy = locationsRootPathFindBrokerProxy();
  const registryPathProxy = locationsRegistryPathFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  fsMkdirAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const renameProxy = fsRenameAdapterProxy();

  const queuePaths = (): void => {
    rootPathProxy.setupRootPath({ homeDir: HOME_DIR, homePath, rootPath });
    registryPathProxy.setupRegistryPath({ homeDir: HOME_DIR, homePath, rootPath, registryPath });
    pathJoinProxy.returns({ result: tmpPath });
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
