import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts/absolute-file-path/absolute-file-path.stub';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

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
  const readFileProxy = readFileIfExistsProxy();

  return {
    setupServerLog: ({
      evidencePath,
      content,
    }: {
      evidencePath: AbsoluteFilePath;
      content: string;
    }): void => {
      const logPath = AbsoluteFilePathStub({ value: `${evidencePath}/api-server.log` });
      readFileProxy.returns({ path: logPath, contents: content });
    },

    setupMissingServerLog: ({ evidencePath }: { evidencePath: AbsoluteFilePath }): void => {
      const logPath = AbsoluteFilePathStub({ value: `${evidencePath}/api-server.log` });
      readFileProxy.missing({ path: logPath });
    },
  };
};
