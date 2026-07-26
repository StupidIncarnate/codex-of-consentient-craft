import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsReadJsonlAdapterProxy } from '../../../adapters/fs/read-jsonl/fs-read-jsonl-adapter.proxy';

export const chatReplayJsonlReadBrokerProxy = (): {
  returns: (params: { filePath: AbsoluteFilePath; content: string }) => void;
  throws: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
  throwsOnce: (params: { filePath: AbsoluteFilePath; error: Error }) => void;
} => {
  const readJsonlProxy = fsReadJsonlAdapterProxy();
  return {
    returns: ({ filePath, content }: { filePath: AbsoluteFilePath; content: string }): void => {
      readJsonlProxy.returns({ filePath, content });
    },
    throws: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      readJsonlProxy.throws({ filePath, error });
    },
    throwsOnce: ({ filePath, error }: { filePath: AbsoluteFilePath; error: Error }): void => {
      readJsonlProxy.throwsOnce({ filePath, error });
    },
  };
};
