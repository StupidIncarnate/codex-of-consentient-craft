import { homedir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
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

  // `join` is a real pass-through with no gateway proxy of its own, so nothing normally mocks
  // it here. But a cross-package composer importing this proxy through
  // `@dungeonmaster/shared/testing` pulls in every OTHER proxy that barrel still re-exports —
  // including the not-yet-deleted `path-join-adapter.proxy.ts`, whose own `registerMock({fn:
  // join})` gets statically collected and hoisted for that consumer's test file even though
  // nothing there ever calls it. That leaves `join` a bare, unconfigured jest.fn() returning
  // `undefined` unless THIS proxy also gives it a real, working default — a real passthrough via
  // requireActual, same mechanism the adapter proxy used, bypassing whichever mock (if any) is
  // covering it.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  return {
    setupProjectsRoot: ({ homeDir }: { homeDir: FilePath }): void => {
      homedirHandle.onceFor([]).returns(String(homeDir));
    },
  };
};
