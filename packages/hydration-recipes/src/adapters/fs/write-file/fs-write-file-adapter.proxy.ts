import { writeFile } from 'fs/promises';

import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsWriteFileAdapterProxy = (): {
  succeeds: ({ filePath }: { filePath: string }) => void;
  getWrittenContents: ({ filePath }: { filePath: string }) => unknown;
} => {
  const handle = registerMock({ fn: writeFile });

  return {
    succeeds: ({ filePath }: { filePath: string }): void => {
      handle.calledWith([filePath]).resolves(undefined);
    },
    getWrittenContents: ({ filePath }: { filePath: string }): unknown =>
      handle.callsMatching([filePath]).at(-1)?.[1],
  };
};
