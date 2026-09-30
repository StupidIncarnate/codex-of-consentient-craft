import { Buffer } from '#gateway/node/buffer';
import { readFileBytesSyncProxy } from '#gateway/node/fs/read-file-bytes-sync/read-file-bytes-sync.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';


export const bundleHashFilesBrokerProxy = (): {
  hasFile: (params: {
    rootPath: string;
    relativePath: string;
    contents: string;
  }) => void;
  hasBytes: (params: {
    rootPath: string;
    relativePath: string;
    bytes: readonly number[];
  }) => void;
  isDirectory: (params: { rootPath: string; relativePath: string }) => void;
  isMissing: (params: { rootPath: string; relativePath: string }) => void;
  failsWith: (params: {
    rootPath: string;
    relativePath: string;
    code: string;
  }) => void;
} => {
  const readProxy = readFileBytesSyncProxy();

  const addressOf = ({
    rootPath,
    relativePath,
  }: {
    rootPath: string;
    relativePath: string;
  }): string => `${String(rootPath)}/${String(relativePath)}`;

  return {
    hasFile: ({
      rootPath,
      relativePath,
      contents,
    }: {
      rootPath: string;
      relativePath: string;
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
      relativePath: string;
      bytes: readonly number[];
    }): void => {
      readProxy.returns({ path: addressOf({ rootPath, relativePath }), bytes: Buffer.from(bytes) });
    },
    isDirectory: ({
      rootPath,
      relativePath,
    }: {
      rootPath: string;
      relativePath: string;
    }): void => {
      readProxy.isDirectory({ path: addressOf({ rootPath, relativePath }) });
    },
    isMissing: ({
      rootPath,
      relativePath,
    }: {
      rootPath: string;
      relativePath: string;
    }): void => {
      readProxy.missing({ path: addressOf({ rootPath, relativePath }) });
    },
    failsWith: ({
      rootPath,
      relativePath,
      code,
    }: {
      rootPath: string;
      relativePath: string;
      code: string;
    }): void => {
      const path = addressOf({ rootPath, relativePath });
      readProxy.throws({ path, error: FsErrorStub({ code, path }) });
    },
  };
};
