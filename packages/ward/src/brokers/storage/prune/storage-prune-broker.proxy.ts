import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import {
  filePathContract,
  type AbsoluteFilePath,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

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
  setupReaddirFail: (params: { rootPath: AbsoluteFilePath }) => void;
  getDeletedPaths: () => unknown[];
} => {
  const readdirProxy = readdirIfExistsProxy();
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
      readdirProxy.returns({ path: String(wardDirFor({ rootPath })), names: entries });

      for (const [name, mtimeMs] of Object.entries(mtimes)) {
        statProxy.returnsMtime({ filePath: runFilePathFor({ rootPath, name }), mtimeMs });
      }
      for (const name of statNullFor) {
        statProxy.returnsNull({ filePath: runFilePathFor({ rootPath, name }) });
      }
    },
    setupEmpty: ({ rootPath }: { rootPath: AbsoluteFilePath }): void => {
      readdirProxy.returns({ path: String(wardDirFor({ rootPath })), names: [] });
    },
    setupReaddirFail: ({ rootPath }: { rootPath: AbsoluteFilePath }): void => {
      readdirProxy.missing({ path: String(wardDirFor({ rootPath })) });
    },
    getDeletedPaths: (): unknown[] => unlinkProxy.getDeletedPaths(),
  };
};
