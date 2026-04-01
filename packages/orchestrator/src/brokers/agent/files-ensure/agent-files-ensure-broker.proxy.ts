import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { registerModuleMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { agentFilesEnsureBroker } from './agent-files-ensure-broker';

registerModuleMock({ module: './agent-files-ensure-broker' });

export const agentFilesEnsureBrokerProxy = (): {
  getAllWrittenFiles: ReturnType<typeof fsWriteFileAdapterProxy>['getAllWrittenFiles'];
  getCreatedDirs: ReturnType<typeof fsMkdirAdapterProxy>['getCreatedDirs'];
  setupWriteThrows: (params: { error: Error }) => void;
  setupMkdirThrows: (params: { error: Error }) => void;
  enableRealImplementation: () => void;
} => {
  pathJoinAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  const realMod = requireActual({ module: './agent-files-ensure-broker' });
  const realImpl = Reflect.get(
    realMod as object,
    'agentFilesEnsureBroker',
  ) as typeof agentFilesEnsureBroker;

  return {
    getAllWrittenFiles: writeProxy.getAllWrittenFiles,
    getCreatedDirs: mkdirProxy.getCreatedDirs,
    setupWriteThrows: ({ error }: { error: Error }): void => {
      writeProxy.throws({ error });
    },
    setupMkdirThrows: ({ error }: { error: Error }): void => {
      mkdirProxy.throws({ filepath: '' as never, error });
    },
    enableRealImplementation: (): void => {
      (
        agentFilesEnsureBroker as jest.MockedFunction<typeof agentFilesEnsureBroker>
      ).mockImplementation(realImpl);
    },
  };
};
