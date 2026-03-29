import { homedir } from 'os';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const osHomedirAdapterProxy = (): {
  returns: ({ path }: { path: string }) => void;
  setEnvHome: ({ path }: { path: string }) => void;
  clearEnvHome: () => void;
} => {
  const handle = registerMock({ fn: homedir });

  handle.mockReturnValue('/home/default');

  return {
    returns: ({ path }: { path: string }): void => {
      handle.mockReturnValueOnce(path);
    },
    setEnvHome: ({ path }: { path: string }): void => {
      process.env.DUNGEONMASTER_HOME = path;
    },
    clearEnvHome: (): void => {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    },
  };
};
