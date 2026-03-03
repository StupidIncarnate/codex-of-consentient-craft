import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { questPersistBrokerProxy } from '../persist/quest-persist-broker.proxy';

export const questUpdateStepBrokerProxy = (): {
  setupQuestRead: (params: { questJson: string }) => void;
  setupQuestReadError: (params: { error: Error }) => void;
  setupQuestWriteSuccess: () => void;
  setupQuestWriteError: (params: { error: Error }) => void;
  getQuestWrittenContent: () => unknown;
  getQuestWrittenPath: () => unknown;
} => {
  const fsReadFileProxy = fsReadFileAdapterProxy();
  const persistProxy = questPersistBrokerProxy();

  return {
    setupQuestRead: ({ questJson }: { questJson: string }): void => {
      fsReadFileProxy.resolves({ content: questJson });
    },
    setupQuestReadError: ({ error }: { error: Error }): void => {
      fsReadFileProxy.rejects({ error });
    },
    setupQuestWriteSuccess: (): void => {
      persistProxy.setupPersist({
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        outboxFilePath: FilePathStub({ value: '/home/testuser/.dungeonmaster/outbox.jsonl' }),
      });
    },
    setupQuestWriteError: ({ error }: { error: Error }): void => {
      persistProxy.setupWriteFailure({ error });
    },
    getQuestWrittenContent: (): unknown => persistProxy.getWrittenContent(),
    getQuestWrittenPath: (): unknown => persistProxy.getWrittenPath(),
  };
};
