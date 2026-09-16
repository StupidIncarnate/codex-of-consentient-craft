import { appendFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsAppendFileAdapterProxy = (): {
  succeeds: (params: { filePath: AbsoluteFilePath }) => void;
  throws: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  getAppendedFor: (params: { filePath: AbsoluteFilePath }) => unknown[];
} => {
  const mock: MockHandle = registerMock({ fn: appendFile });

  return {
    succeeds: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      mock.calledWith([filePath]).resolves(undefined);
    },

    throws: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },

    // Every chunk appended to this path, in call order — so a test can prove a second flush
    // landed after the first rather than replacing it.
    getAppendedFor: ({ filePath }: { filePath: AbsoluteFilePath }): unknown[] =>
      mock.callsMatching([filePath]).map((call) => call[1]),
  };
};
