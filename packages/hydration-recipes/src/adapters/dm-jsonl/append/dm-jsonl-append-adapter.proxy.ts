import { appendFile, mkdir } from 'fs/promises';
import { dirname } from 'path';

import { registerMock } from '@dungeonmaster/testing/register-mock';

export const dmJsonlAppendAdapterProxy = (): {
  succeeds: ({ filePath }: { filePath: string }) => void;
  getAppendedContents: ({ filePath }: { filePath: string }) => unknown;
} => {
  const mkdirHandle = registerMock({ fn: mkdir });
  const appendHandle = registerMock({ fn: appendFile });

  return {
    succeeds: ({ filePath }: { filePath: string }): void => {
      mkdirHandle.calledWith([dirname(filePath)]).resolves(undefined);
      appendHandle.calledWith([filePath]).resolves(undefined);
    },
    getAppendedContents: ({ filePath }: { filePath: string }): unknown =>
      appendHandle.callsMatching([filePath]).at(-1)?.[1],
  };
};
