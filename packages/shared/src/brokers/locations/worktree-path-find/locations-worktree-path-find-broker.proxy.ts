import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const locationsWorktreePathFindBrokerProxy = (): {
  setupWorktreePath: (params: {
    repoRoot: string;
    worktreeDirName: string;
    worktreePath: string;
  }) => void;
} => {
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports.
  const joinHandle = registerMock({ fn: join });

  return {
    setupWorktreePath: ({
      repoRoot,
      worktreeDirName,
      worktreePath,
    }: {
      repoRoot: string;
      worktreeDirName: string;
      worktreePath: string;
    }): void => {
      joinHandle
        .calledWith([repoRoot, locationsStatics.repoRoot.worktreesDir, worktreeDirName])
        .returns(worktreePath);
    },
  };
};
