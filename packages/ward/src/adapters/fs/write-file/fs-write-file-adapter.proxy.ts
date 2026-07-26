import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsWriteFileAdapterProxy = (): {
  succeeds: (params: { filePath: FilePath }) => void;
  throws: (params: { filePath: FilePath; error: Error }) => void;
  getWrittenContent: (params: { filePath: FilePath }) => unknown;
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const mock = registerMock({ fn: writeFile });

  return {
    succeeds: ({ filePath }: { filePath: FilePath }): void => {
      mock.calledWith([filePath]).resolves({ success: true as const });
    },

    throws: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },

    getWrittenContent: ({ filePath }: { filePath: FilePath }): unknown =>
      mock.callsMatching([filePath]).at(-1)?.[1],

    getAllWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      mock.callsMatching([]).map((call) => ({
        path: call[0],
        content: call[1],
      })),
  };
};
