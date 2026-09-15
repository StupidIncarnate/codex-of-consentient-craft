// PURPOSE: Proxy for server-log-reader-layer-broker — delegates to fsReadFileSyncAdapter's proxy.
// USAGE: const proxy = serverLogReaderLayerBrokerProxy(); proxy.setupLogContent({ logPath, content });

import { fsReadFileSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import type { AbsoluteFilePath, ContentText } from '@dungeonmaster/shared/contracts';

export const serverLogReaderLayerBrokerProxy = (): {
  setupLogContent: (params: { logPath: AbsoluteFilePath; content: ContentText }) => void;
} => {
  const fsProxy = fsReadFileSyncAdapterProxy();

  return {
    setupLogContent: ({
      logPath,
      content,
    }: {
      logPath: AbsoluteFilePath;
      content: ContentText;
    }): void => {
      fsProxy.returns({ filePath: logPath, content });
    },
  };
};
