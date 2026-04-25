import { cwd } from 'process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const processCwdAdapterProxy = (): {
  returns: ({ path }: { path: string }) => void;
} => {
  const handle = registerMock({ fn: cwd });

  handle.mockReturnValue('/default/cwd');

  return {
    returns: ({ path }: { path: string }): void => {
      handle.mockReturnValueOnce(path);
    },
  };
};
