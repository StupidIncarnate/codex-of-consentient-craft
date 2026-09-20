import { writeFile } from 'fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

export const fsWriteFileAdapterProxy = (): {
  succeeds: (params: { filePath: AbsoluteFilePath }) => void;
  throws: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  throwsOnce: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  getWrittenFor: (params: { filePath: AbsoluteFilePath }) => unknown;
  getFlagFor: (params: { filePath: AbsoluteFilePath }) => unknown;
} => {
  const mock: MockHandle = registerMock({ fn: writeFile });

  return {
    succeeds: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      mock.calledWith([filePath]).resolves(undefined);
    },

    throws: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      mock.calledWith([filePath]).rejects(error);
    },

    // A live one-shot outranks the catch-all `calledWith` staging for its ONE matching call, then
    // falls through — lets a test fail the first write and succeed the retry without reordering.
    throwsOnce: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      mock.onceFor([filePath]).rejects(error);
    },

    getWrittenFor: ({ filePath }: { filePath: AbsoluteFilePath }): unknown =>
      mock.callsMatching([filePath]).at(-1)?.[1],

    // Reads the `flag` off the options object the LAST call passed as its 3rd argument — 'wx' for
    // an exclusive create, 'w' for the default overwrite — so a test can prove which one fired.
    getFlagFor: ({ filePath }: { filePath: AbsoluteFilePath }): unknown => {
      const options = mock.callsMatching([filePath]).at(-1)?.[2];
      return options !== null && typeof options === 'object' && 'flag' in options
        ? options.flag
        : undefined;
    },
  };
};
