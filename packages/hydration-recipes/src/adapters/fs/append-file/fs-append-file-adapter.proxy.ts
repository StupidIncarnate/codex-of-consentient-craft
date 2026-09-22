import { appendFile } from 'fs/promises';

import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsAppendFileAdapterProxy = (): {
  succeeds: ({ filePath }: { filePath: string }) => void;
  getAppendedContents: ({ filePath }: { filePath: string }) => unknown;
  getAppendedPaths: () => readonly unknown[];
} => {
  const handle = registerMock({ fn: appendFile });

  return {
    succeeds: ({ filePath }: { filePath: string }): void => {
      handle.calledWith([filePath]).resolves(undefined);
    },
    getAppendedContents: ({ filePath }: { filePath: string }): unknown =>
      handle.callsMatching([filePath]).at(-1)?.[1],
    getAppendedPaths: (): readonly unknown[] => handle.callsMatching([]).map((call) => call[0]),
  };
};
