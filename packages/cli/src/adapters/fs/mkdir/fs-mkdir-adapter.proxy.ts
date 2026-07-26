import { mkdir } from 'fs/promises';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsMkdirAdapterProxy = (): {
  succeeds: ({ filePath }: { filePath: FilePath }) => void;
  throws: ({ filePath, error }: { filePath: FilePath; error: Error }) => void;
  getMkdirCalls: () => readonly { path: unknown; options: unknown }[];
} => {
  const handle = registerMock({ fn: mkdir });

  return {
    succeeds: ({ filePath }: { filePath: FilePath }): void => {
      handle.calledWith([filePath]).resolves(undefined);
    },
    throws: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      handle.calledWith([filePath]).rejects(error);
    },
    getMkdirCalls: (): readonly { path: unknown; options: unknown }[] =>
      handle.callsMatching([]).map((call) => ({ path: call[0], options: call[1] })),
  };
};
