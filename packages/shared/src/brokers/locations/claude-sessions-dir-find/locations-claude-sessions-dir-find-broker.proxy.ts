import { osUserHomedirAdapterProxy } from '../../../adapters/os/user-homedir/os-user-homedir-adapter.proxy';

export const locationsClaudeSessionsDirFindBrokerProxy = (): {
  setupSessionsDir: (params: { userHome: string }) => void;
} => {
  const userHomedirProxy = osUserHomedirAdapterProxy();

  return {
    setupSessionsDir: ({ userHome }: { userHome: string }): void => {
      userHomedirProxy.returns({ path: userHome });
    },
  };
};
