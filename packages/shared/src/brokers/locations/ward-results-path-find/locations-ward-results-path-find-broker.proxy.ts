import { join } from '#gateway/node/path';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { locationsStatics } from '../../../statics/locations/locations-statics';

export const locationsWardResultsPathFindBrokerProxy = (): {
  setupWardResultsPath: (params: { questFolderPath: string; wardResultsPath: string }) => void;
} => {
  // #gateway/node/path is a raw passthrough of the Node 'path' module (no per-function wrapper,
  // so no gateway proxy to compose) — mocked directly here, on the same '#gateway/node/path'
  // specifier the broker imports.
  const joinHandle = registerMock({ fn: join });

  return {
    setupWardResultsPath: ({
      questFolderPath,
      wardResultsPath,
    }: {
      questFolderPath: string;
      wardResultsPath: string;
    }): void => {
      joinHandle
        .calledWith([questFolderPath, locationsStatics.quest.wardResultsDir])
        .returns(wardResultsPath);
    },
  };
};
