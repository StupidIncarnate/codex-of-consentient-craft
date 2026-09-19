// PURPOSE: Proxy for fs-write-text-adapter — mocks `mkdir` and `writeFile` from fs/promises, each
// addressed by its own path, so two files written in one test never answer each other's call.
// USAGE: const proxy = fsWriteTextAdapterProxy(); proxy.succeeds({ filePath }); proxy.writtenTo({ filePath });

import { mkdir, writeFile } from 'fs/promises';
import { dirname } from 'path';

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsWriteTextAdapterProxy = (): {
  succeeds: (params: { filePath: AbsoluteFilePath }) => void;
  throwsOnWrite: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  writtenTo: (params: { filePath: AbsoluteFilePath }) => unknown;
  pathsWritten: () => readonly unknown[];
  directoriesCreated: () => readonly unknown[];
} => {
  const mkdirMock = registerMock({ fn: mkdir });
  const writeMock = registerMock({ fn: writeFile });

  return {
    succeeds: ({ filePath }: { filePath: AbsoluteFilePath }): void => {
      mkdirMock.calledWith([dirname(filePath)]).resolves(undefined);
      writeMock.calledWith([filePath]).resolves(undefined);
    },

    throwsOnWrite: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      mkdirMock.calledWith([dirname(filePath)]).resolves(undefined);
      writeMock.calledWith([filePath]).rejects(error);
    },

    // The contents argument of the LAST write to this path — the write body is arg 1.
    writtenTo: ({ filePath }: { filePath: AbsoluteFilePath }): unknown =>
      writeMock.callsMatching([filePath]).at(-1)?.[1],

    // Every path written, in order — the file SET a caller produced, without their contents.
    pathsWritten: (): readonly unknown[] => writeMock.callsMatching([]).map((call) => call[0]),

    directoriesCreated: (): readonly unknown[] =>
      mkdirMock.callsMatching([]).map((call) => call[0]),
  };
};
