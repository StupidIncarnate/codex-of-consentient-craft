import { osUserHomedirAdapterProxy } from '../../../adapters/os/user-homedir/os-user-homedir-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsClaudeConfigDirFindBrokerProxy = (): {
  returns: (params: { path: string }) => void;
  setupUnset: (params: { homeDir: FilePath }) => void;
} => {
  const homedirProxy = osUserHomedirAdapterProxy();
  // Constructed for enforce-proxy-child-creation, and deliberately left on its real-join
  // default: staging a fixed pathJoinAdapter result here would make the fallback tests
  // pass no matter which locationsStatics segment the broker joins onto the home dir. The
  // real join is what actually proves the broker reads locationsStatics.userHome.claude.dir.
  pathJoinAdapterProxy();

  return {
    returns: ({ path }: { path: string }): void => {
      process.env.CLAUDE_CONFIG_DIR = path;
    },
    setupUnset: ({ homeDir }: { homeDir: FilePath }): void => {
      Reflect.deleteProperty(process.env, 'CLAUDE_CONFIG_DIR');
      homedirProxy.returns({ path: homeDir });
    },
  };
};
