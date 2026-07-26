import { rename } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsRenameAdapterProxy = (): {
  succeeds: (params: { from: FilePath }) => void;
  throws: (params: { from: FilePath; error: Error }) => void;
  getRenameCalls: () => readonly { from: unknown; to: unknown }[];
} => {
  const handle = registerMock({ fn: rename });

  return {
    succeeds: ({ from }: { from: FilePath }): void => {
      handle.calledWith([from]).resolves(undefined);
    },
    throws: ({ from, error }: { from: FilePath; error: Error }): void => {
      handle.calledWith([from]).rejects(error);
    },
    getRenameCalls: (): readonly { from: unknown; to: unknown }[] =>
      handle.callsMatching([]).map((call) => ({ from: call[0], to: call[1] })),
  };
};
