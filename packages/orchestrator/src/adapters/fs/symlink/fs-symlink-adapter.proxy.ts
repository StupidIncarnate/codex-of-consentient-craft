import { symlink } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsSymlinkAdapterProxy = (): {
  succeeds: (params: { target: FilePath }) => void;
  throws: (params: { target: FilePath; error: Error }) => void;
  getLinkPathFor: (params: { target: FilePath }) => unknown;
  getAllSymlinks: () => readonly { target: unknown; linkPath: unknown }[];
} => {
  const mock: MockHandle = registerMock({ fn: symlink });

  return {
    succeeds: ({ target }: { target: FilePath }): void => {
      mock.calledWith([target]).resolves(undefined);
    },

    throws: ({ target, error }: { target: FilePath; error: Error }): void => {
      mock.calledWith([target]).rejects(error);
    },

    getLinkPathFor: ({ target }: { target: FilePath }): unknown =>
      mock.callsMatching([target]).at(-1)?.[1],

    getAllSymlinks: (): readonly { target: unknown; linkPath: unknown }[] =>
      mock.callsMatching([]).map((call) => ({
        target: call[0],
        linkPath: call[1],
      })),
  };
};
