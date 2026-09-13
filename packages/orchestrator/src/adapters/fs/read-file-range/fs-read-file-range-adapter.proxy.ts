import { open } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import type { FilePathStub } from '@dungeonmaster/shared/contracts';

type FilePath = ReturnType<typeof FilePathStub>;

export const fsReadFileRangeAdapterProxy = (): {
  setupFile: (params: { filePath: FilePath; contents: string }) => void;
  setupOpenFailure: (params: { filePath: FilePath; error: Error }) => void;
} => {
  const openHandle = registerMock({ fn: open });

  return {
    // The adapter stats through the open handle rather than the path, so this fake reports the
    // size of the contents it will serve and copies the requested slice out of them — which is
    // what makes a tail read actually observable in a test rather than assumed.
    setupFile: ({ filePath, contents }: { filePath: FilePath; contents: string }): void => {
      const buffer = Buffer.from(contents, 'utf8');

      openHandle.calledWith([filePath, 'r']).resolves({
        stat: async (): Promise<unknown> => Promise.resolve({ size: buffer.length }),
        read: async (...args: readonly unknown[]): Promise<unknown> => {
          const target = args[0] as Buffer;
          const offset = Number(args[1]);
          const length = Number(args[2]);
          const position = Number(args[3]);
          buffer.copy(target, offset, position, position + length);
          return Promise.resolve({ bytesRead: length });
        },
        close: async (): Promise<unknown> => Promise.resolve(undefined),
      } as never);
    },

    setupOpenFailure: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      openHandle.calledWith([filePath, 'r']).rejects(error);
    },
  };
};
