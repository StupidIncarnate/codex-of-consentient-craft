import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

export const serverWindowReadLayerBrokerProxy = (): {
  setupServerLog: (params: { evidencePath: string; content: string }) => void;
  setupMissingServerLog: (params: { evidencePath: string }) => void;
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
      evidencePath: string;
      content: string;
    }): void => {
      const logPath = `${evidencePath}/api-server.log`;
      readFileProxy.returns({ path: logPath, contents: content });
    },

    setupMissingServerLog: ({ evidencePath }: { evidencePath: string }): void => {
      const logPath = `${evidencePath}/api-server.log`;
      readFileProxy.missing({ path: logPath });
    },
  };
};
