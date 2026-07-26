import { homedir } from 'os';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const osUserHomedirAdapterProxy = (): {
  returns: ({ path }: { path: string }) => void;
} => {
  const handle = registerMock({ fn: homedir });

  // homedir() takes no arguments — [] is the honest address, not a shortcut. This is the
  // SAME underlying npm `homedir` function os-homedir-adapter.proxy.ts mocks; both proxies
  // share one global answer, which is correct because the real os.homedir() call itself
  // never differs between the two adapters — only the wrapper code around it does.
  handle.calledWith([]).returns('/home/default');

  return {
    returns: ({ path }: { path: string }): void => {
      handle.onceFor([]).returns(path);
    },
  };
};
