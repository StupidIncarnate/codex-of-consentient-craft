jest.mock('os');

import { homedir } from 'os';

export const osUserHomedirAdapterProxy = (): {
  returns: (params: { path: string }) => void;
} => {
  const mock = jest.mocked(homedir);

  mock.mockReturnValue('/home/default');

  return {
    returns: ({ path }: { path: string }): void => {
      mock.mockReturnValueOnce(path);
    },
  };
};
