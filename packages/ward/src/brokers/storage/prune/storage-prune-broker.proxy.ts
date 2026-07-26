import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import {
  filePathContract,
  type AbsoluteFilePath,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';

export const storagePruneBrokerProxy = (): {
  setupWithFiles: (params: { rootPath: AbsoluteFilePath; entries: string[]; now: number }) => void;
  setupEmpty: (params: { rootPath: AbsoluteFilePath }) => void;
  setupReaddirFail: (params: { rootPath: AbsoluteFilePath; error: Error }) => void;
} => {
  const readdirProxy = fsReaddirAdapterProxy();
  fsUnlinkAdapterProxy();

  const wardDirFor = ({ rootPath }: { rootPath: AbsoluteFilePath }): FilePath =>
    filePathContract.parse(`${rootPath}/.ward`);

  return {
    setupWithFiles: ({
      rootPath,
      entries,
      now,
    }: {
      rootPath: AbsoluteFilePath;
      entries: string[];
      now: number;
    }): void => {
      registerSpyOn({ object: Date, method: 'now' }).calledWith([]).returns(now);
      readdirProxy.returns({ dirPath: wardDirFor({ rootPath }), entries });
    },
    setupEmpty: ({ rootPath }: { rootPath: AbsoluteFilePath }): void => {
      readdirProxy.returns({ dirPath: wardDirFor({ rootPath }), entries: [] });
    },
    setupReaddirFail: ({ rootPath, error }: { rootPath: AbsoluteFilePath; error: Error }): void => {
      readdirProxy.throws({ dirPath: wardDirFor({ rootPath }), error });
    },
  };
};
