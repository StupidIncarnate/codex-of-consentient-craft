import { homedir } from 'os';

jest.mock('os');

export const osHomedirAdapterProxy = (): {
  returns: ({ path }: { path: string }) => void;
  setEnvHome: ({ path }: { path: string }) => void;
  clearEnvHome: () => void;
} => {
  const mock = jest.mocked(homedir);

  mock.mockReturnValue('/home/default');

  return {
    returns: ({ path }: { path: string }): void => {
      mock.mockReturnValueOnce(path);
    },
    setEnvHome: ({ path }: { path: string }): void => {
      process.env.DUNGEONMASTER_HOME = path;
    },
    clearEnvHome: (): void => {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    },
  };
};
