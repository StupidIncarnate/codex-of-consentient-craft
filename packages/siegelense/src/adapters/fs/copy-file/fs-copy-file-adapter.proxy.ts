import { copyFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsCopyFileAdapterProxy = (): {
  succeeds: (params: { sourcePath: AbsoluteFilePath }) => void;
  throws: (params: { sourcePath: AbsoluteFilePath; error: Error }) => void;
  getDestinationPathFor: (params: { sourcePath: AbsoluteFilePath }) => unknown;
} => {
  const mock: MockHandle = registerMock({ fn: copyFile });
  mock.calledWith([]).resolves(undefined);

  return {
    succeeds: ({ sourcePath }: { sourcePath: AbsoluteFilePath }): void => {
      mock.calledWith([sourcePath]).resolves(undefined);
    },

    throws: ({ sourcePath, error }: { sourcePath: AbsoluteFilePath; error: Error }): void => {
      mock.calledWith([sourcePath]).rejects(error);
    },

    getDestinationPathFor: ({ sourcePath }: { sourcePath: AbsoluteFilePath }): unknown =>
      mock.callsMatching([sourcePath]).at(-1)?.[1],
  };
};
