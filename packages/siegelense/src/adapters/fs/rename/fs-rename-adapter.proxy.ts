import { rename } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsRenameAdapterProxy = (): {
  succeeds: (params: { fromPath: AbsoluteFilePath }) => void;
  throws: (params: { fromPath: AbsoluteFilePath; error: Error }) => void;
  getToPathFor: (params: { fromPath: AbsoluteFilePath }) => unknown;
} => {
  const mock: MockHandle = registerMock({ fn: rename });

  return {
    succeeds: ({ fromPath }: { fromPath: AbsoluteFilePath }): void => {
      mock.calledWith([fromPath]).resolves(undefined);
    },

    throws: ({ fromPath, error }: { fromPath: AbsoluteFilePath; error: Error }): void => {
      mock.calledWith([fromPath]).rejects(error);
    },

    getToPathFor: ({ fromPath }: { fromPath: AbsoluteFilePath }): unknown =>
      mock.callsMatching([fromPath]).at(-1)?.[1],
  };
};
