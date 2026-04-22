import { osHomedirAdapterProxy } from '../../../adapters/os/homedir/os-homedir-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const dungeonmasterHomeFindBrokerProxy = (): {
  setupHomePath: (params: { homeDir: string; homePath: FilePath }) => void;
  setHomeEnv: (params: { value: string }) => void;
  clearHomeEnv: () => void;
} => {
  const homedirProxy = osHomedirAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupHomePath: ({ homeDir, homePath }: { homeDir: string; homePath: FilePath }): void => {
      homedirProxy.returns({ path: homeDir });
      pathJoinProxy.returns({ result: homePath });
    },
    setHomeEnv: ({ value }: { value: string }): void => {
      process.env.DUNGEONMASTER_HOME = value;
    },
    clearHomeEnv: (): void => {
      Reflect.deleteProperty(process.env, 'DUNGEONMASTER_HOME');
    },
  };
};
