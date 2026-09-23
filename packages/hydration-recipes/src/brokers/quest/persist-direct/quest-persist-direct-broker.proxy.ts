import { fsAppendFileAdapterProxy } from '../../../adapters/fs/append-file/fs-append-file-adapter.proxy';
import { fsRenameAdapterProxy } from '../../../adapters/fs/rename/fs-rename-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import type { DmQuestOutboxLineStub } from '../../../contracts/dm-quest-outbox-line/dm-quest-outbox-line.stub';

type DmQuestOutboxLine = ReturnType<typeof DmQuestOutboxLineStub>;

export const questPersistDirectBrokerProxy = (): {
  succeeds: ({ questFilePath, outboxPath }: { questFilePath: string; outboxPath: string }) => void;
  getWrittenContents: ({ questFilePath }: { questFilePath: string }) => unknown;
  getOutboxLine: ({ outboxPath }: { outboxPath: string }) => DmQuestOutboxLine;
  pathsTouched: () => readonly unknown[];
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
    // Every filesystem path this broker reached, in the order it reached them: the temp file, the
    // name it renamed that to, then the outbox it appended. A caller asserting containment inside a
    // target reads this rather than the staged addresses — a staged address only proves the mock
    // was told about a path, never that the code went there.
    pathsTouched: (): readonly unknown[] => [
      ...writeProxy.getWrittenPaths(),
      ...renameProxy.getRenameTargets(),
      ...appendProxy.getAppendedPaths(),
    ],
  };
};
