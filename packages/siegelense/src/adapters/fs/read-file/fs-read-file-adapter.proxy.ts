import { readFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsReadFileAdapterProxy = (): {
  resolves: (params: { filePath: AbsoluteFilePath; content: string }) => void;
  // A low-specificity fallback for ANY path — a literal `resolves({filePath, ...})` staged
  // afterward still wins (exact array match outranks a function matcher), so a caller composing
  // this as a child proxy gets one safe default and can still override individual paths.
  resolvesAny: (params: { content: string }) => void;
  rejects: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  encodingUsedFor: (params: { filePath: AbsoluteFilePath }) => unknown;
} => {
  const mock: MockHandle = registerMock({ fn: readFile });

  return {
    resolves: ({ filePath, content }: { filePath: AbsoluteFilePath; content: string }): void => {
      mock.calledWith([filePath]).resolves(content);
    },

    resolvesAny: ({ content }: { content: string }): void => {
      mock.calledWith([(): boolean => true]).resolves(content);
    },

    rejects: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },

    // The second argument the adapter actually forwarded to `readFile` — proof `encoding` reached
    // the npm call rather than being accepted and dropped.
    encodingUsedFor: ({ filePath }: { filePath: AbsoluteFilePath }): unknown =>
      mock.callsMatching([filePath]).at(-1)?.[1],
  };
};
