import { appendFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsAppendFileAdapterProxy = (): {
  succeeds: (params: { filePath: FilePath }) => void;
  throws: (params: { filePath: FilePath; error: Error }) => void;
  getAppendCalls: () => readonly { path: unknown; content: unknown }[];
} => {
  const handle = registerMock({ fn: appendFile });

  return {
    succeeds: ({ filePath }: { filePath: FilePath }): void => {
      handle.calledWith([filePath]).resolves(undefined);
    },
    throws: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      handle.calledWith([filePath]).rejects(error);
    },
    getAppendCalls: (): readonly { path: unknown; content: unknown }[] =>
      handle.callsMatching([]).map((call) => ({ path: call[0], content: call[1] })),
  };
};
