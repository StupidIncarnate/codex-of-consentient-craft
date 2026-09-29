// PURPOSE: Stages the two fs reads the paste payload makes — whether the file exists, and its bytes
// — addressed by path, so a test names exactly the file a paste step points at.
// USAGE: const proxy = pastePayloadLayerBrokerProxy();
//        proxy.setupFileExists({ filePath, content: Buffer.from('fake-png') });

import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { readFileBytesSyncProxy } from '#gateway/node/fs/read-file-bytes-sync/read-file-bytes-sync.proxy';

export const pastePayloadLayerBrokerProxy = (): {
  setupFileExists: (params: { filePath: string; content: Buffer }) => void;
  setupFileNotFound: (params: { filePath: string }) => void;
  getReadPaths: () => readonly unknown[];
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = readFileBytesSyncProxy();

  return {
    setupFileExists: ({ filePath, content }: { filePath: string; content: Buffer }): void => {
      existsProxy.returns({ path: filePath, exists: true });
      readProxy.returns({ path: filePath, bytes: content });
    },
    setupFileNotFound: ({ filePath }: { filePath: string }): void => {
      existsProxy.returns({ path: filePath, exists: false });
    },
    getReadPaths: (): readonly unknown[] =>
      readProxy
        .getCallsFor({ path: (value: unknown): boolean => typeof value === 'string' })
        .map((call) => call[0]),
  };
};
