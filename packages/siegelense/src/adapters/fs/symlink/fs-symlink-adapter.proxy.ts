import { symlink } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsSymlinkAdapterProxy = (): {
  succeeds: (params: { targetPath: AbsoluteFilePath; linkPath: AbsoluteFilePath }) => void;
  throws: (params: {
    targetPath: AbsoluteFilePath;
    linkPath: AbsoluteFilePath;
    error: Error;
  }) => void;
  getCalls: () => readonly { targetPath: unknown; linkPath: unknown; type: unknown }[];
} => {
  const mock: MockHandle = registerMock({ fn: symlink });

  return {
    succeeds: ({
      targetPath,
      linkPath,
    }: {
      targetPath: AbsoluteFilePath;
      linkPath: AbsoluteFilePath;
    }): void => {
      mock.calledWith([targetPath, linkPath]).resolves(undefined);
    },

    throws: ({
      targetPath,
      linkPath,
      error,
    }: {
      targetPath: AbsoluteFilePath;
      linkPath: AbsoluteFilePath;
      error: Error;
    }): void => {
      mock.calledWith([targetPath, linkPath]).rejects(error);
    },

    // The whole call list, never a single indexed entry — the responder makes at most one
    // symlink call per run, so "how many, with what args" is the entire question a test asks.
    getCalls: (): readonly { targetPath: unknown; linkPath: unknown; type: unknown }[] =>
      mock
        .callsMatching([])
        .map((call) => ({ targetPath: call[0], linkPath: call[1], type: call[2] })),
  };
};
