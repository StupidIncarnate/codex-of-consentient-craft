import {
  dungeonmasterHomeEnsureBrokerProxy,
  locationsDispatchStatePathFindBrokerProxy,
  locationsDispatchStateTmpPathFindBrokerProxy,
} from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

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
  const writeHandle = writeFileProxy();
  const renameHandle = renameProxy();

  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns('2024-01-15T10:00:00.000Z');

  const homePath = FilePathStub({ value: '/home/user/.dungeonmaster' });
  // Every test in this suite writes/renames the same fixed dispatch-state tmp path — hardcode it
  // as the address instead of re-deriving it per call.
  const tmpPath = FilePathStub({
    value: '/home/user/.dungeonmaster/dispatch-state.json.tmp',
  });
  const statePath = FilePathStub({ value: '/home/user/.dungeonmaster/dispatch-state.json' });

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
      dispatchStatePath: statePath,
    });
    tmpPathProxy.setupDispatchStateTmpPath({
      homeDir: '/home/user',
      homePath,
      dispatchStateTmpPath: tmpPath,
    });
  };

  return {
    setupWriteSuccess: (): void => {
      queuePaths();
      writeHandle.succeeds({ path: tmpPath });
      renameHandle.succeeds({ from: tmpPath, to: statePath });
    },

    setupWriteFailure: ({ error }: { error: Error }): void => {
      queuePaths();
      // A real write rejects with an errno-coded error; the caller's Error keeps its identity and
      // message and gains the code the gateway proxy's contract asks for.
      writeHandle.rejects({ path: tmpPath, error: Object.assign(error, { code: 'EIO' }) });
    },

    getWrittenContent: (): unknown => writeHandle.writtenContentsFor({ path: tmpPath }),

    getWrittenPath: (): unknown => tmpPath,

    getRenamedTo: (): unknown =>
      renameHandle.getCallsFor({ from: tmpPath, to: statePath }).at(-1)?.[1],
  };
};
