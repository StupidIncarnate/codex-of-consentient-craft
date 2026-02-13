import { homedir } from 'os';

jest.mock('os');

export const osHomedirAdapterProxy = (): {
  returns: ({ path }: { path: string }) => void;
} => {
  const mock = jest.mocked(homedir);

  mock.mockReturnValue('/home/default');

  return {
    returns: ({ path }: { path: string }): void => {
      mock.mockReturnValueOnce(path);
    },
  };
};
