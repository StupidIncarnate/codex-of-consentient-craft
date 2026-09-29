import { homedir } from '#gateway/node/os';
import { deleteEnv, setEnv } from '#gateway/node/process';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsClaudeConfigDirFindBrokerProxy = (): {
  returns: (params: { path: string }) => void;
  setupUnset: (params: { homeDir: FilePath }) => void;
} => {
  const homedirHandle = registerMock({ fn: homedir });

  // homedir() takes no arguments — [] is the honest address, not a shortcut. This is the SAME
  // underlying npm `homedir` function every other proxy across the repo mocks (a shared,
  // global registration), so a sticky low-specificity default here is what keeps a composing
  // proxy elsewhere — one that only constructs this proxy to satisfy
  // enforce-proxy-child-creation, without ever calling setupUnset — from throwing on an
  // unstaged call instead of crashing with "nothing set up for the call".
  homedirHandle.calledWith([]).returns('/home/default');

  return {
    returns: ({ path }: { path: string }): void => {
      setEnv('CLAUDE_CONFIG_DIR', path);
    },
    setupUnset: ({ homeDir }: { homeDir: FilePath }): void => {
      deleteEnv('CLAUDE_CONFIG_DIR');
      homedirHandle.onceFor([]).returns(String(homeDir));
    },
  };
};
