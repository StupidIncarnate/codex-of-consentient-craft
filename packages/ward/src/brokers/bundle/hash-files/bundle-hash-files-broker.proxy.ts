import { Buffer } from '#gateway/node/buffer';
import { readFileBytesSyncProxy } from '#gateway/node/fs/read-file-bytes-sync/read-file-bytes-sync.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';

import type { GitRelativePath } from '../../../contracts/git-relative-path/git-relative-path-contract';

export const bundleHashFilesBrokerProxy = (): {
  hasFile: (params: {
    rootPath: string;
    relativePath: GitRelativePath;
    contents: string;
  }) => void;
  hasBytes: (params: {
    rootPath: string;
    relativePath: GitRelativePath;
    bytes: readonly number[];
  }) => void;
  isDirectory: (params: { rootPath: string; relativePath: GitRelativePath }) => void;
  isMissing: (params: { rootPath: string; relativePath: GitRelativePath }) => void;
  failsWith: (params: {
    rootPath: string;
    relativePath: GitRelativePath;
    code: string;
  }) => void;
} => {
  const readProxy = readFileBytesSyncProxy();

  const addressOf = ({
    rootPath,
    relativePath,
  }: {
    rootPath: string;
    relativePath: GitRelativePath;
  }): string => `${String(rootPath)}/${String(relativePath)}`;

  return {
    hasFile: ({
      rootPath,
      relativePath,
      contents,
    }: {
      rootPath: string;
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
      rootPath: string;
      relativePath: GitRelativePath;
      bytes: readonly number[];
    }): void => {
      readProxy.returns({ path: addressOf({ rootPath, relativePath }), bytes: Buffer.from(bytes) });
    },
    isDirectory: ({
      rootPath,
      relativePath,
    }: {
      rootPath: string;
      relativePath: GitRelativePath;
    }): void => {
      readProxy.isDirectory({ path: addressOf({ rootPath, relativePath }) });
    },
    isMissing: ({
      rootPath,
      relativePath,
    }: {
      rootPath: string;
      relativePath: GitRelativePath;
    }): void => {
      readProxy.missing({ path: addressOf({ rootPath, relativePath }) });
    },
    failsWith: ({
      rootPath,
      relativePath,
      code,
    }: {
      rootPath: string;
      relativePath: GitRelativePath;
      code: string;
    }): void => {
      const path = addressOf({ rootPath, relativePath });
      readProxy.throws({ path, error: FsErrorStub({ code, path }) });
    },
  };
};
