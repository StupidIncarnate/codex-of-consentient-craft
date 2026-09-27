import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsWardLocalRunPathFindBrokerProxy = (): {
  setupWardLocalRunPath: (params: { rootPath: string; runId: string; runPath: FilePath }) => void;
} => {
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports.
  const joinHandle = registerMock({ fn: join });

  return {
    setupWardLocalRunPath: ({
      rootPath,
      runId,
      runPath,
    }: {
      rootPath: string;
      runId: string;
      runPath: FilePath;
    }): void => {
      joinHandle
        .calledWith([rootPath, locationsStatics.repoRoot.wardLocalDir, `run-${runId}.json`])
        .returns(runPath);
    },
  };
};
