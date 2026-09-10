import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import {
  filePathContract,
  type AbsoluteFilePath,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsStatAdapterProxy } from '../../../adapters/fs/stat/fs-stat-adapter.proxy';
import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';

export const storagePruneBrokerProxy = (): {
  setupWithFiles: (params: {
    rootPath: AbsoluteFilePath;
    entries: string[];
    now: number;
    mtimes?: Record<string, number>;
    statNullFor?: string[];
  }) => void;
  setupEmpty: (params: { rootPath: AbsoluteFilePath }) => void;
  setupReaddirFail: (params: { rootPath: AbsoluteFilePath; error: Error }) => void;
  getDeletedPaths: () => unknown[];
} => {
  const readdirProxy = fsReaddirAdapterProxy();
  const statProxy = fsStatAdapterProxy();
  const unlinkProxy = fsUnlinkAdapterProxy();

  // The sweep chooses its own paths, so they cannot be staged one by one without staging the
  // answer. fsUnlinkAdapter never reads unlink's resolved value either, so a catch-all is enough.
  unlinkProxy.succeedsForAnyPath();

  const wardDirFor = ({ rootPath }: { rootPath: AbsoluteFilePath }): FilePath =>
    filePathContract.parse(`${rootPath}/.ward`);

  const runFilePathFor = ({
    rootPath,
    name,
  }: {
    rootPath: AbsoluteFilePath;
    name: string;
  }): FilePath => filePathContract.parse(`${wardDirFor({ rootPath })}/${name}`);

  return {
    setupWithFiles: ({
      rootPath,
      entries,
      now,
      mtimes = {},
      statNullFor = [],
    }: {
      rootPath: AbsoluteFilePath;
      entries: string[];
      now: number;
      mtimes?: Record<string, number>;
      statNullFor?: string[];
    }): void => {
      registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(now);
      readdirProxy.returns({ dirPath: wardDirFor({ rootPath }), entries });

      for (const [name, mtimeMs] of Object.entries(mtimes)) {
        statProxy.returnsMtime({ filePath: runFilePathFor({ rootPath, name }), mtimeMs });
      }
      for (const name of statNullFor) {
        statProxy.returnsNull({ filePath: runFilePathFor({ rootPath, name }) });
      }
    },
    setupEmpty: ({ rootPath }: { rootPath: AbsoluteFilePath }): void => {
      readdirProxy.returns({ dirPath: wardDirFor({ rootPath }), entries: [] });
    },
    setupReaddirFail: ({ rootPath, error }: { rootPath: AbsoluteFilePath; error: Error }): void => {
      readdirProxy.throws({ dirPath: wardDirFor({ rootPath }), error });
    },
    getDeletedPaths: (): unknown[] => unlinkProxy.getDeletedPaths(),
  };
};
