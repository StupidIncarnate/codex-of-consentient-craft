import {
  dungeonmasterHomeEnsureBrokerProxy,
  locationsDispatchStatePathFindBrokerProxy,
  locationsDispatchStateTmpPathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const dispatchStateWriteBrokerProxy = (): {
  setupWriteSuccess: () => void;
  setupWriteFailure: (params: { error: Error }) => void;
  getWrittenContent: () => unknown;
  getWrittenPath: () => unknown;
  getRenamedTo: () => unknown;
} => {
  const ensureProxy = dungeonmasterHomeEnsureBrokerProxy();
  const statePathProxy = locationsDispatchStatePathFindBrokerProxy();
  const tmpPathProxy = locationsDispatchStateTmpPathFindBrokerProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const renameProxy = fsRenameAdapterProxy();

  registerSpyOn({ object: Date.prototype, method: 'toISOString' }).mockReturnValue(
    '2024-01-15T10:00:00.000Z',
  );

  const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });

  // Queue the once-value chains in the broker's execution order: ensure-home first, then
  // the state-file path lookup, then the tmp-file path lookup.
  const queuePaths = (): void => {
    ensureProxy.setupEnsureSuccess({
      homeDir: '/home/user',
      homePath,
      guildsPath: FilePathStub({ value: '/home/user/.dungeonmaster/guilds' }),
    });
    statePathProxy.setupDispatchStatePath({
      homeDir: '/home/user',
      homePath,
      dispatchStatePath: FilePathStub({ value: '/home/user/.dungeonmaster/dispatch-state.json' }),
    });
    tmpPathProxy.setupDispatchStateTmpPath({
      homeDir: '/home/user',
      homePath,
      dispatchStateTmpPath: FilePathStub({
        value: '/home/user/.dungeonmaster/dispatch-state.json.tmp',
      }),
    });
  };

  return {
    setupWriteSuccess: (): void => {
      queuePaths();
      writeFileProxy.succeeds();
      renameProxy.succeeds();
    },

    setupWriteFailure: ({ error }: { error: Error }): void => {
      queuePaths();
      writeFileProxy.throws({ error });
    },

    getWrittenContent: (): unknown => writeFileProxy.getWrittenContent(),

    getWrittenPath: (): unknown => writeFileProxy.getWrittenPath(),

    getRenamedTo: (): unknown => renameProxy.getToPath(),
  };
};
