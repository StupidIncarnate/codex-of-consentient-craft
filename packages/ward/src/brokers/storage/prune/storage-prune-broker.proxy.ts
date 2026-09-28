import { readdirIfExistsProxy } from '#gateway/node/fs__promises/readdir-if-exists/readdir-if-exists.proxy';
import { statIfExistsProxy } from '#gateway/node/fs__promises/stat-if-exists/stat-if-exists.proxy';
import { unlinkProxy } from '#gateway/node/fs__promises/unlink/unlink.proxy';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import {
  filePathContract,
  type AbsoluteFilePath,
  type FilePath,
} from '@dungeonmaster/shared/contracts';

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
  const statProxy = statIfExistsProxy();
  const unlink = unlinkProxy();

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
        statProxy.returnsFile({
          path: String(runFilePathFor({ rootPath, name })),
          sizeBytes: 1024,
          modifiedAtMs: mtimeMs,
        });
      }
      for (const name of statNullFor) {
        statProxy.missing({ path: String(runFilePathFor({ rootPath, name })) });
      }
      for (const name of entries) {
        unlink.succeeds({ path: String(runFilePathFor({ rootPath, name })) });
      }
    },
    setupEmpty: ({ rootPath }: { rootPath: AbsoluteFilePath }): void => {
      readdirProxy.returns({ path: String(wardDirFor({ rootPath })), names: [] });
    },
    setupReaddirFail: ({ rootPath }: { rootPath: AbsoluteFilePath }): void => {
      readdirProxy.missing({ path: String(wardDirFor({ rootPath })) });
    },
    getDeletedPaths: (): unknown[] =>
      unlink.getCallsFor({ path: () => true }).map((call) => call[0]),
  };
};
