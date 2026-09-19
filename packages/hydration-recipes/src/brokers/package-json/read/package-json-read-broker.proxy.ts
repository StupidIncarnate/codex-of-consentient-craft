/**
 * PURPOSE: Proxy for packageJsonReadBroker — composes fsReadFileSyncAdapterProxy so a test
 * controls the file's raw text without touching a real path on disk.
 *
 * USAGE:
 * const proxy = packageJsonReadBrokerProxy();
 * proxy.returns({ filePath: '/repo/package.json', contents: '{"private":true}' });
 */

import { fsReadFileSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { AbsoluteFilePathStub, ContentTextStub } from '@dungeonmaster/shared/contracts';

export const packageJsonReadBrokerProxy = (): {
  returns: (params: { filePath: string; contents: string }) => void;
} => {
  const fsProxy = fsReadFileSyncAdapterProxy();

  return {
    returns: ({ filePath, contents }: { filePath: string; contents: string }): void => {
      fsProxy.returns({
        filePath: AbsoluteFilePathStub({ value: filePath }),
        content: ContentTextStub({ value: contents }),
      });
    },
  };
};
