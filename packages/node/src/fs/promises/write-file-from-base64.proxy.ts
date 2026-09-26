import { writeFileBytesProxy } from './write-file-bytes.proxy';
import type { FsError } from '../is-fs-error';

export const writeFileFromBase64Proxy = (): {
  succeeds: ({ path }: { path: string }) => void;
  rejects: ({ path, error }: { path: string; error: FsError }) => void;
  writtenBytesFor: ({ path }: { path: string }) => unknown;
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
  };
};
