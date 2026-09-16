import { rm } from 'fs/promises';

import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsRmAdapterProxy = (): {
  succeeds: ({ filePath }: { filePath: string }) => void;
} => {
  const handle = registerMock({ fn: rm });

  return {
    succeeds: ({ filePath }: { filePath: string }): void => {
      handle.calledWith([filePath]).resolves(undefined);
    },
  };
};
