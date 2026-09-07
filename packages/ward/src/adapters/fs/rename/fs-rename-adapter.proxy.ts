import { rename } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsRenameAdapterProxy = (): {
  succeeds: (params: { fromPath: FilePath; toPath: FilePath }) => void;
  losesRace: (params: { fromPath: FilePath; toPath: FilePath }) => void;
  throws: (params: { fromPath: FilePath; toPath: FilePath; error: Error }) => void;
  getCallsFor: (params: { fromPath: FilePath }) => readonly unknown[][];
} => {
  const mock = registerMock({ fn: rename });

  return {
    succeeds: ({ fromPath, toPath }: { fromPath: FilePath; toPath: FilePath }): void => {
      mock.calledWith([fromPath, toPath]).resolves(undefined);
    },
    losesRace: ({ fromPath, toPath }: { fromPath: FilePath; toPath: FilePath }): void => {
      mock
        .calledWith([fromPath, toPath])
        .rejects(Object.assign(new Error('ENOTEMPTY: directory not empty'), { code: 'ENOTEMPTY' }));
    },
    throws: ({
      fromPath,
      toPath,
      error,
    }: {
      fromPath: FilePath;
      toPath: FilePath;
      error: Error;
    }): void => {
      mock.calledWith([fromPath, toPath]).rejects(error);
    },
    getCallsFor: ({ fromPath }: { fromPath: FilePath }): readonly unknown[][] =>
      mock.callsMatching([fromPath]),
  };
};
