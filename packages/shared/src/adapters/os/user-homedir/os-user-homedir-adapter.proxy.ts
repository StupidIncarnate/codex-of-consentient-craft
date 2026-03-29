import { homedir } from 'os';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const osUserHomedirAdapterProxy = (): {
  returns: ({ path }: { path: string }) => void;
} => {
  const handle = registerMock({ fn: homedir });

  handle.mockReturnValue('/home/default');

  return {
    returns: ({ path }: { path: string }): void => {
      handle.mockReturnValueOnce(path);
    },
  };
};
