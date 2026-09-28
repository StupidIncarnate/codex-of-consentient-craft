import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { errorIsNativeErrorAdapterProxy } from '../../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const serverWindowReadLayerBrokerProxy = (): {
  setupServerLog: (params: { evidencePath: AbsoluteFilePath; content: string }) => void;
  setupMissingServerLog: (params: { evidencePath: AbsoluteFilePath }) => void;
} => {
  // `join` (from '#gateway/node/path') runs for real, on a sticky passthrough default — the log
  // path is a plain `path.join(evidencePath, 'api-server.log')`.
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  errorIsNativeErrorAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupServerLog: ({
      evidencePath,
      content,
    }: {
      evidencePath: AbsoluteFilePath;
      content: string;
    }): void => {
      const logPath = AbsoluteFilePathStub({ value: `${evidencePath}/api-server.log` });
      readFileProxy.resolves({ filePath: logPath, content });
    },

    setupMissingServerLog: ({ evidencePath }: { evidencePath: AbsoluteFilePath }): void => {
      const logPath = AbsoluteFilePathStub({ value: `${evidencePath}/api-server.log` });
      readFileProxy.rejects({
        filePath: logPath,
        error: Object.assign(new Error('ENOENT: no such file or directory'), { code: 'ENOENT' }),
      });
    },
  };
};
