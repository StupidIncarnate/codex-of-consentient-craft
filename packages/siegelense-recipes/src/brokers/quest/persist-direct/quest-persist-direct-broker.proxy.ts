import { fsAppendFileAdapterProxy } from '../../../adapters/fs/append-file/fs-append-file-adapter.proxy';
import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import type { DmQuestOutboxLineStub } from '../../../contracts/dm-quest-outbox-line/dm-quest-outbox-line.stub';

type DmQuestOutboxLine = ReturnType<typeof DmQuestOutboxLineStub>;

export const questPersistDirectBrokerProxy = (): {
  succeeds: ({ questFilePath, outboxPath }: { questFilePath: string; outboxPath: string }) => void;
  getWrittenContents: ({ questFilePath }: { questFilePath: string }) => unknown;
  getOutboxLine: ({ outboxPath }: { outboxPath: string }) => DmQuestOutboxLine;
} => {
  const writeProxy = fsWriteFileAdapterProxy();
  const renameProxy = fsRenameAdapterProxy();
  const appendProxy = fsAppendFileAdapterProxy();

  return {
    succeeds: ({
      questFilePath,
      outboxPath,
    }: {
      questFilePath: string;
      outboxPath: string;
    }): void => {
      const tmpPath = `${questFilePath}.tmp`;
      writeProxy.succeeds({ filePath: tmpPath });
      renameProxy.succeeds({ from: tmpPath, to: questFilePath });
      appendProxy.succeeds({ filePath: outboxPath });
    },
    getWrittenContents: ({ questFilePath }: { questFilePath: string }): unknown =>
      writeProxy.getWrittenContents({ filePath: `${questFilePath}.tmp` }),
    getOutboxLine: ({ outboxPath }: { outboxPath: string }): DmQuestOutboxLine => {
      const appended = appendProxy.getAppendedContents({ filePath: outboxPath });
      return JSON.parse(String(appended)) as DmQuestOutboxLine;
    },
  };
};
