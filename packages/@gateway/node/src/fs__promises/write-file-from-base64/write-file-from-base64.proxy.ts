import { writeFileBytesProxy } from '../write-file-bytes/write-file-bytes.proxy';
import type { FsError } from '../../fs/is-fs-error/fs-error';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

export const writeFileFromBase64Proxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  rejects: ({ path, error }: { path: string; error: FsError }) => void;
  writtenBytesFor: ({ path }: { path: string }) => unknown;
  getCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const bytesProxy = writeFileBytesProxy();

  return {
    succeeds: ({ path }: { path: string }): void => {
      bytesProxy.succeeds({ path });
    },
    rejects: ({ path, error }: { path: string; error: FsError }): void => {
      bytesProxy.rejects({ path, error });
    },
    writtenBytesFor: ({ path }: { path: string }): unknown => bytesProxy.writtenBytesFor({ path }),
    getCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      bytesProxy.getCallsFor({ path }),
  };
};
