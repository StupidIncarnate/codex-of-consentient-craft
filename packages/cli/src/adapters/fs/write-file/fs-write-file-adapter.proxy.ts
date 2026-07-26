import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsWriteFileAdapterProxy = (): {
  succeeds: (params: { filePath: FilePath }) => void;
  throws: (params: { filePath: FilePath; error: Error }) => void;
  getWrittenFor: (params: { filePath: FilePath }) => unknown;
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const handle = registerMock({ fn: writeFile });

  return {
    succeeds: ({ filePath }: { filePath: FilePath }): void => {
      handle.calledWith([filePath]).resolves({ success: true as const });
    },

    throws: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      handle.calledWith([filePath]).rejects(error);
    },

    getWrittenFor: ({ filePath }: { filePath: FilePath }): unknown =>
      handle.callsMatching([filePath]).at(-1)?.[1],

    getAllWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      handle.callsMatching([]).map((call) => ({
        path: call[0],
        content: call[1],
      })),
  };
};
