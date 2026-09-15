import { readlink } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsReadlinkAdapterProxy = (): {
  resolves: (params: { linkPath: AbsoluteFilePath; resolvedTarget: string }) => void;
  rejects: (params: { linkPath: AbsoluteFilePath; error: Error }) => void;
  getCalls: () => readonly unknown[];
} => {
  const mock: MockHandle = registerMock({ fn: readlink });

  return {
    resolves: ({
      linkPath,
      resolvedTarget,
    }: {
      linkPath: AbsoluteFilePath;
      resolvedTarget: string;
    }): void => {
      mock.calledWith([linkPath]).resolves(resolvedTarget);
    },

    rejects: ({ linkPath, error }: { linkPath: AbsoluteFilePath; error: Error }): void => {
      mock.calledWith([linkPath]).rejects(error);
    },

    // The whole call list — lets a caller (the responder proxy) prove readlink WAS reached for a
    // given link, paired with a symlink call count of zero, without addressing by return value.
    getCalls: (): readonly unknown[] => mock.callsMatching([]).map((call) => call[0]),
  };
};
