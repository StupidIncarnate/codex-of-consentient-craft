import { dirname, join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { questsFolderStatics } from '../../../statics/quests-folder/quests-folder-statics';

type FilePath = ReturnType<typeof FilePathStub>;

export const projectRootFindBrokerProxy = (): {
  setupProjectRootFound: (params: { startPath: string; projectRootPath: string }) => void;
  setupProjectRootNotFound: (params: { startPath: string }) => void;
  setupProjectRootFoundInParent: (params: {
    startPath: string;
    parentPath: string;
    projectRootPath: string;
  }) => void;
  setupProjectRootFoundInDirectory: (params: { directoryPath: string }) => void;
  setupProjectRootFoundInDirectoryParent: (params: {
    directoryPath: string;
    projectRootPath: string;
  }) => void;
} => {
  const pathExistsHandle = pathExistsProxy();

  // join/dirname are pure and carry no gateway proxy of their own (#gateway/node/path is a raw
  // passthrough), so they are mocked directly here — but the mock MUST be registered on `join`/
  // `dirname` as imported from '#gateway/node/path' (the same specifier the broker imports),
  // never from raw 'path' (see config-root-find-broker.proxy.ts, which this proxy mirrors, for
  // why the specifier must match exactly). The REAL values still come from requireActual, never
  // the (possibly mocked) import above. Each call is staged on a SPECIFIC argument tuple, never a
  // bare `calledWith([])`, except the sticky real-passthrough default every unstaged call falls
  // back to.
  const realPath = requireActual<{ join: typeof join; dirname: typeof dirname }>({
    module: 'path',
  });
  const joinHandle = registerMock({ fn: join });
  const dirnameHandle = registerMock({ fn: dirname });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  const packageJsonPathFor = ({ dirPath }: { dirPath: string }): FilePath => {
    const packageJsonFile = questsFolderStatics.files.packageJson;
    const packageJsonPath = FilePathStub({ value: realPath.join(dirPath, packageJsonFile) });
    joinHandle.calledWith([dirPath, packageJsonFile]).returns(packageJsonPath);
    return packageJsonPath;
  };

  const dirnameFor = ({ dirPath }: { dirPath: string }): FilePath => {
    const parent = FilePathStub({ value: realPath.dirname(dirPath) });
    dirnameHandle.calledWith([dirPath]).returns(parent);
    return parent;
  };

  // Recursive, not a loop: the real walk visits every ancestor directory one at a time, so
  // every level needs its own staged "missing" answer up to (but not including) stopAt — or
  // all the way to the filesystem root when stopAt is omitted. The object literal below omits
  // `stopAt` rather than passing it as `undefined` (exactOptionalPropertyTypes).
  const stageMissingUntil = ({ dirPath, stopAt }: { dirPath: string; stopAt?: string }): void => {
    if (stopAt !== undefined && dirPath === stopAt) {
      return;
    }
    pathExistsHandle.missing({ path: packageJsonPathFor({ dirPath }) });
    const parent = dirnameFor({ dirPath });
    if (parent === dirPath) {
      return;
    }
    stageMissingUntil(stopAt === undefined ? { dirPath: parent } : { dirPath: parent, stopAt });
  };

  return {
    setupProjectRootFound: ({
      startPath,
      projectRootPath,
    }: {
      startPath: string;
      projectRootPath: string;
    }): void => {
      stageMissingUntil({ dirPath: startPath, stopAt: projectRootPath });
      pathExistsHandle.present({ path: packageJsonPathFor({ dirPath: projectRootPath }) });
    },

    setupProjectRootNotFound: ({ startPath }: { startPath: string }): void => {
      stageMissingUntil({ dirPath: startPath });
    },

    setupProjectRootFoundInParent: ({
      startPath,
      parentPath: _parentPath,
      projectRootPath,
    }: {
      startPath: string;
      parentPath: string;
      projectRootPath: string;
    }): void => {
      stageMissingUntil({ dirPath: startPath, stopAt: projectRootPath });
      pathExistsHandle.present({ path: packageJsonPathFor({ dirPath: projectRootPath }) });
    },

    setupProjectRootFoundInDirectory: ({ directoryPath }: { directoryPath: string }): void => {
      pathExistsHandle.present({ path: packageJsonPathFor({ dirPath: directoryPath }) });
    },

    setupProjectRootFoundInDirectoryParent: ({
      directoryPath,
      projectRootPath,
    }: {
      directoryPath: string;
      projectRootPath: string;
    }): void => {
      stageMissingUntil({ dirPath: directoryPath, stopAt: projectRootPath });
      pathExistsHandle.present({ path: packageJsonPathFor({ dirPath: projectRootPath }) });
    },
  };
};
