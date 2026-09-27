import { homedir } from '#gateway/node/os';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsClaudeProjectsRootFindBrokerProxy = (): {
  setupProjectsRoot: (params: { homeDir: FilePath }) => void;
} => {
  const homedirHandle = registerMock({ fn: homedir });

  // homedir() takes no arguments — [] is the honest address, not a shortcut. This is the SAME
  // underlying npm `homedir` function every other proxy across the repo mocks (a shared,
  // global registration), so a sticky low-specificity default here is what keeps a composing
  // proxy elsewhere — one that only constructs this proxy to satisfy
  // enforce-proxy-child-creation, without ever calling setupProjectsRoot — from throwing on an
  // unstaged call instead of crashing with "nothing set up for the call".
  homedirHandle.calledWith([]).returns('/home/default');

  return {
    setupProjectsRoot: ({ homeDir }: { homeDir: FilePath }): void => {
      homedirHandle.onceFor([]).returns(String(homeDir));
    },
  };
};
