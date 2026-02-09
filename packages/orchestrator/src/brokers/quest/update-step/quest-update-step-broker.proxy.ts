import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const questUpdateStepBrokerProxy = (): {
  setupQuestRead: (params: { questJson: string }) => void;
  setupQuestReadError: (params: { error: Error }) => void;
  setupQuestWriteSuccess: () => void;
  setupQuestWriteError: (params: { error: Error }) => void;
  getQuestWrittenContent: () => unknown;
  getQuestWrittenPath: () => unknown;
} => {
  const fsReadFileProxy = fsReadFileAdapterProxy();
  const fsWriteFileProxy = fsWriteFileAdapterProxy();

  return {
    setupQuestRead: ({ questJson }: { questJson: string }): void => {
      fsReadFileProxy.resolves({ content: questJson });
    },
    setupQuestReadError: ({ error }: { error: Error }): void => {
      fsReadFileProxy.rejects({ error });
    },
    setupQuestWriteSuccess: (): void => {
      fsWriteFileProxy.succeeds();
    },
    setupQuestWriteError: ({ error }: { error: Error }): void => {
      fsWriteFileProxy.throws({ error });
    },
    getQuestWrittenContent: (): unknown => fsWriteFileProxy.getWrittenContent(),
    getQuestWrittenPath: (): unknown => fsWriteFileProxy.getWrittenPath(),
  };
};
