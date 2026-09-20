import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const fsEnsureWriteAdapterProxy = (): {
  succeeds: ({ filepath, contents }: { filepath: FilePath; contents: FileContents }) => void;
  throws: ({ filepath, error }: { filepath: FilePath; error: Error }) => void;
  getWrittenFor: ({ filepath }: { filepath: FilePath }) => unknown;
  getMkdirCallsFor: ({ filepath }: { filepath: FilePath }) => unknown;
} => {
  const mockMkdir = registerMock({ fn: mkdir });
  const mockWriteFile = registerMock({ fn: writeFile });

  return {
    // mkdir always succeeds for both scenarios below — the directory-creation step is not what
    // either scenario is distinguishing, only the write step is.
    succeeds: ({
      filepath,
      contents: _contents,
    }: {
      filepath: FilePath;
      contents: FileContents;
    }): void => {
      mockMkdir.calledWith([dirname(filepath)]).resolves(undefined);
      mockWriteFile.calledWith([filepath]).resolves({ success: true as const });
    },
    throws: ({ filepath, error }: { filepath: FilePath; error: Error }): void => {
      mockMkdir.calledWith([dirname(filepath)]).resolves(undefined);
      mockWriteFile.calledWith([filepath]).rejects(error);
    },

    // Answers for THIS path only — a call to a different path never satisfies this lookup.
    getWrittenFor: ({ filepath }: { filepath: FilePath }): unknown =>
      mockWriteFile.callsMatching([filepath]).at(-1)?.[1],

    // The full argument list, so a test can confirm { recursive: true } was actually passed.
    getMkdirCallsFor: ({ filepath }: { filepath: FilePath }): unknown =>
      mockMkdir.callsMatching([dirname(filepath)]),
  };
};
