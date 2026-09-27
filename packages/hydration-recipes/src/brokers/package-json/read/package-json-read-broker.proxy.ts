/**
 * PURPOSE: Proxy for packageJsonReadBroker — composes readFileSyncProxy so a test
 * controls the file's raw text without touching a real path on disk.
 *
 * USAGE:
 * const proxy = packageJsonReadBrokerProxy();
 * proxy.returns({ filePath: '/repo/package.json', contents: '{"private":true}' });
 */

import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

export const packageJsonReadBrokerProxy = (): {
  returns: (params: { filePath: string; contents: string }) => void;
} => {
  const fsProxy = readFileSyncProxy();

  return {
    returns: ({ filePath, contents }: { filePath: string; contents: string }): void => {
      fsProxy.returns({
        path: filePath,
        contents,
      });
    },
  };
};
