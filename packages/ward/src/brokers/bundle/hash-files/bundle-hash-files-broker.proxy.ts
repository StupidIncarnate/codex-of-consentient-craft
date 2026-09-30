import { Buffer } from '#gateway/node/buffer';
import { readFileBytesSyncProxy } from '#gateway/node/fs/read-file-bytes-sync/read-file-bytes-sync.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { GitRelativePath } from '../../../contracts/git-relative-path/git-relative-path-contract';

export const bundleHashFilesBrokerProxy = (): {
  hasFile: (params: {
    rootPath: AbsoluteFilePath;
    relativePath: GitRelativePath;
    contents: string;
  }) => void;
  hasBytes: (params: {
    rootPath: AbsoluteFilePath;
    relativePath: GitRelativePath;
    bytes: readonly number[];
  }) => void;
  isDirectory: (params: { rootPath: AbsoluteFilePath; relativePath: GitRelativePath }) => void;
  isMissing: (params: { rootPath: AbsoluteFilePath; relativePath: GitRelativePath }) => void;
  failsWith: (params: {
    rootPath: AbsoluteFilePath;
    relativePath: GitRelativePath;
    code: string;
  }) => void;
} => {
  const readProxy = readFileBytesSyncProxy();

  const addressOf = ({
    rootPath,
    relativePath,
  }: {
    rootPath: AbsoluteFilePath;
    relativePath: GitRelativePath;
  }): string => `${String(rootPath)}/${String(relativePath)}`;

  return {
    hasFile: ({
      rootPath,
      relativePath,
      contents,
    }: {
      rootPath: AbsoluteFilePath;
      relativePath: GitRelativePath;
      contents: string;
    }): void => {
      readProxy.returns({
        path: addressOf({ rootPath, relativePath }),
        bytes: Buffer.from(contents, 'utf8'),
      });
    },
    hasBytes: ({
      rootPath,
      relativePath,
      bytes,
    }: {
      rootPath: AbsoluteFilePath;
      relativePath: GitRelativePath;
      bytes: readonly number[];
    }): void => {
      readProxy.returns({ path: addressOf({ rootPath, relativePath }), bytes: Buffer.from(bytes) });
    },
    isDirectory: ({
      rootPath,
      relativePath,
    }: {
      rootPath: AbsoluteFilePath;
      relativePath: GitRelativePath;
    }): void => {
      readProxy.isDirectory({ path: addressOf({ rootPath, relativePath }) });
    },
    isMissing: ({
      rootPath,
      relativePath,
    }: {
      rootPath: AbsoluteFilePath;
      relativePath: GitRelativePath;
    }): void => {
      readProxy.missing({ path: addressOf({ rootPath, relativePath }) });
    },
    failsWith: ({
      rootPath,
      relativePath,
      code,
    }: {
      rootPath: AbsoluteFilePath;
      relativePath: GitRelativePath;
      code: string;
    }): void => {
      const path = addressOf({ rootPath, relativePath });
      readProxy.throws({ path, error: FsErrorStub({ code, path }) });
    },
  };
};
