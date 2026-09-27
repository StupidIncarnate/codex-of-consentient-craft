import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { locationsStatics } from '../../../statics/locations/locations-statics';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const locationsPlannedWorkPathFindBrokerProxy = (): {
  setupPlannedWorkPath: (params: { plannedWorkPath: FilePath }) => void;
} => {
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports. questFolderPath is recovered by slicing the known
  // 'planned-work' suffix off plannedWorkPath, so join() is staged on the EXACT tuple the broker
  // really passes.
  const joinHandle = registerMock({ fn: join });

  return {
    setupPlannedWorkPath: ({ plannedWorkPath }: { plannedWorkPath: FilePath }): void => {
      const suffix = `/${locationsStatics.quest.plannedWorkDir}`;
      const questFolderPath = plannedWorkPath.slice(0, plannedWorkPath.length - suffix.length);
      joinHandle
        .calledWith([questFolderPath, locationsStatics.quest.plannedWorkDir])
        .returns(plannedWorkPath);
    },
  };
};
