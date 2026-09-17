import { symlink } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { PathSegment } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsSymlinkAdapterProxy = (): {
  succeeds: (params: { target: PathSegment | FilePath }) => void;
  throws: (params: { target: PathSegment | FilePath; error: Error }) => void;
  getLinkPathFor: (params: { target: PathSegment | FilePath }) => unknown;
  getAllSymlinks: () => readonly { target: unknown; linkPath: unknown }[];
} => {
  const mock: MockHandle = registerMock({ fn: symlink });

  return {
    succeeds: ({ target }: { target: PathSegment | FilePath }): void => {
      mock.calledWith([target]).resolves(undefined);
    },

    throws: ({ target, error }: { target: PathSegment | FilePath; error: Error }): void => {
      mock.calledWith([target]).rejects(error);
    },

    getLinkPathFor: ({ target }: { target: PathSegment | FilePath }): unknown =>
      mock.callsMatching([target]).at(-1)?.[1],

    getAllSymlinks: (): readonly { target: unknown; linkPath: unknown }[] =>
      mock.callsMatching([]).map((call) => ({
        target: call[0],
        linkPath: call[1],
      })),
  };
};
