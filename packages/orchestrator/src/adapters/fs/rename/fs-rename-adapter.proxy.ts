import { rename } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsRenameAdapterProxy = (): {
  succeeds: (params: { from: FilePath }) => void;
  throws: (params: { from: FilePath; error: Error }) => void;
  getToPathFor: (params: { from: FilePath }) => unknown;
  getAllRenames: () => readonly { from: unknown; to: unknown }[];
} => {
  const mock: MockHandle = registerMock({ fn: rename });

  return {
    succeeds: ({ from }: { from: FilePath }): void => {
      mock.calledWith([from]).resolves({ success: true as const });
    },

    throws: ({ from, error }: { from: FilePath; error: Error }): void => {
      mock.calledWith([from]).rejects(error);
    },

    getToPathFor: ({ from }: { from: FilePath }): unknown => mock.callsMatching([from]).at(-1)?.[1],

    getAllRenames: (): readonly { from: unknown; to: unknown }[] =>
      mock.callsMatching([]).map((call) => ({
        from: call[0],
        to: call[1],
      })),
  };
};
