import { existsSync } from 'fs';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const existsSyncProxy = (): {
  returns: ({ path, exists }: { path: string; exists: boolean }) => void;
} => {
  const handle = registerMock({ fn: existsSync });

  return {
    returns: ({ path, exists }: { path: string; exists: boolean }): void => {
      handle.calledWith([path]).returns(exists);
    },
  };
};
