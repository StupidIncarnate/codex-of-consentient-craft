/**
 * PURPOSE: Mocks `node:fs/promises`' `mkdir` and `writeFile` — the two npm-package calls
 * `fsEnsureWriteAdapter` composes into one "safely write a file" operation.
 *
 * USAGE:
 * const proxy = fsEnsureWriteAdapterProxy();
 * proxy.succeeds({ filePath, content });
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import type { AbsoluteFilePath, FileContents } from '@dungeonmaster/shared/contracts';

export const fsEnsureWriteAdapterProxy = (): {
  succeeds: (params: { filePath: AbsoluteFilePath; content: FileContents }) => void;
  writeFails: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  mkdirCalls: () => RecordedCalls;
  writeCalls: () => RecordedCalls;
} => {
  const mkdirHandle = registerMock({ fn: mkdir });
  const writeHandle = registerMock({ fn: writeFile });

  return {
    succeeds: ({
      filePath,
      content,
    }: {
      filePath: AbsoluteFilePath;
      content: FileContents;
    }): void => {
      mkdirHandle.calledWith([]).resolves(undefined);
      writeHandle.calledWith([filePath, content]).resolves(undefined);
    },
    writeFails: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      mkdirHandle.calledWith([]).resolves(undefined);
      writeHandle.calledWith([filePath]).rejects(error);
    },
    mkdirCalls: (): RecordedCalls => mkdirHandle.callsMatching([]),
    writeCalls: (): RecordedCalls => writeHandle.callsMatching([]),
  };
};
