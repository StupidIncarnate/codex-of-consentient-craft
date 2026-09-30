// PURPOSE: Proxy for server-log-reader-layer-broker — delegates to #gateway/node/fs's
// readFileSync proxy.
// USAGE: const proxy = serverLogReaderLayerBrokerProxy(); proxy.setupLogContent({ logPath, content });

import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';
import type { ContentText } from '@dungeonmaster/shared/contracts';

export const serverLogReaderLayerBrokerProxy = (): {
  setupLogContent: (params: { logPath: string; content: ContentText }) => void;
} => {
  const fsProxy = readFileSyncProxy();

  return {
    setupLogContent: ({
      logPath,
      content,
    }: {
      logPath: string;
      content: ContentText;
    }): void => {
      fsProxy.returns({ path: logPath, contents: content });
    },
  };
};
