import { rename } from 'fs/promises';

import { registerMock } from '@dungeonmaster/testing/register-mock';

export const fsRenameAdapterProxy = (): {
  succeeds: ({ from, to }: { from: string; to: string }) => void;
} => {
  const handle = registerMock({ fn: rename });

  return {
    succeeds: ({ from, to }: { from: string; to: string }): void => {
      handle.calledWith([from, to]).resolves(undefined);
    },
  };
};
