import { rm } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsRmAdapterProxy = (): {
  succeeds: (params: { dirPath: AbsoluteFilePath }) => void;
  throws: (params: { dirPath: AbsoluteFilePath; error: Error }) => void;
  getRemovedPaths: () => unknown[];
  getOptionsFor: (params: { dirPath: AbsoluteFilePath }) => unknown;
} => {
  const mock: MockHandle = registerMock({ fn: rm });

  return {
    succeeds: ({ dirPath }: { dirPath: AbsoluteFilePath }): void => {
      mock.calledWith([dirPath]).resolves(undefined);
    },

    throws: ({ dirPath, error }: { dirPath: AbsoluteFilePath; error: Error }): void => {
      mock.calledWith([dirPath]).rejects(error);
    },

    getRemovedPaths: (): unknown[] => mock.callsMatching([]).map((call) => call[0]),

    // Confirms { recursive: true, force: true } was actually passed for this path.
    getOptionsFor: ({ dirPath }: { dirPath: AbsoluteFilePath }): unknown =>
      mock.callsMatching([dirPath]).at(-1)?.[1],
  };
};
