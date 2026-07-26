import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsReadFileAdapterProxy = (): {
  resolves: (params: { filePath: FilePath; content: string }) => void;
  resolvesOnceFor: (params: { filePath: FilePath; content: string }) => void;
  rejects: (params: { filePath: FilePath; error: Error }) => void;
  resolvesNext: (params: { content: string }) => void;
  rejectsNext: (params: { error: Error }) => void;
} => {
  const mock: MockHandle = registerMock({ fn: readFile });

  return {
    resolves: ({ filePath, content }: { filePath: FilePath; content: string }): void => {
      mock.calledWith([filePath]).resolves(content);
    },

    // For a path that gets read more than once across DIFFERENT generations of the same file
    // (e.g. a stale-then-refreshed quest read at the same questFilePath) — a sticky
    // `calledWith` staging would let the later generation's staging shadow the earlier one for
    // every read regardless of which generation is actually current when the read happens.
    // Each call queues one more addressed one-shot, consumed in registration order.
    resolvesOnceFor: ({ filePath, content }: { filePath: FilePath; content: string }): void => {
      mock.onceFor([filePath]).resolves(content);
    },

    rejects: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },

    // For callers with no filePath to address: they read a SEQUENCE of files whose paths are
    // staged separately (a directory-scan loop pairing each entry's path with its content one
    // at a time), and the caller's own public interface carries no path parameter to key on.
    // Queues the NEXT call (any path) to resolve/reject with this value, in staging order.
    resolvesNext: ({ content }: { content: string }): void => {
      mock.onceFor([]).resolves(content);
    },

    rejectsNext: ({ error }: { error: Error }): void => {
      mock.onceFor([]).rejects(error);
    },
  };
};
