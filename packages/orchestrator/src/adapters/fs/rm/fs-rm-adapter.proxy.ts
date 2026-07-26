import { rm } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const fsRmAdapterProxy = (): {
  succeeds: (params: { filePath: FilePath }) => void;
  throws: (params: { filePath: FilePath; error: Error }) => void;
  getCallsFor: (params: { filePath: FilePath }) => readonly unknown[][];
} => {
  const mock = registerMock({ fn: rm });

  return {
    succeeds: ({ filePath }: { filePath: FilePath }): void => {
      mock.calledWith([filePath]).resolves(undefined);
    },
    throws: ({ filePath, error }: { filePath: FilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },
    getCallsFor: ({ filePath }: { filePath: FilePath }): readonly unknown[][] =>
      mock.callsMatching([filePath]),
  };
};
