import { appendFileProxy } from '#gateway/node/fs__promises/append-file/append-file.proxy';
import { renameProxy } from '#gateway/node/fs__promises/rename/rename.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

import type { DmQuestOutboxLineStub } from '../../../contracts/dm-quest-outbox-line/dm-quest-outbox-line.stub';

type DmQuestOutboxLine = ReturnType<typeof DmQuestOutboxLineStub>;

export const questPersistDirectBrokerProxy = (): {
  succeeds: ({ questFilePath, outboxPath }: { questFilePath: string; outboxPath: string }) => void;
  getWrittenContents: ({ questFilePath }: { questFilePath: string }) => unknown;
  getOutboxLine: ({ outboxPath }: { outboxPath: string }) => DmQuestOutboxLine;
  pathsTouched: () => readonly unknown[];
} => {
  const writeProxy = writeFileProxy();
  const renameHandle = renameProxy();
  const appendProxy = appendFileProxy();
  const stagedPaths: unknown[] = [];

  return {
    succeeds: ({
      questFilePath,
      outboxPath,
    }: {
      questFilePath: string;
      outboxPath: string;
    }): void => {
      stagedPaths.length = 0;
      stagedPaths.push(`${questFilePath}.tmp`, questFilePath, outboxPath);
      const tmpPath = `${questFilePath}.tmp`;
      writeProxy.succeeds({ path: tmpPath });
      renameHandle.succeeds({ from: tmpPath, to: questFilePath });
      appendProxy.succeeds({ path: outboxPath });
    },
    getWrittenContents: ({ questFilePath }: { questFilePath: string }): unknown =>
      writeProxy.writtenContentsFor({ path: `${questFilePath}.tmp` }),
    getOutboxLine: ({ outboxPath }: { outboxPath: string }): DmQuestOutboxLine => {
      const appended = appendProxy.appendedContentsFor({ path: outboxPath });
      return JSON.parse(String(appended)) as DmQuestOutboxLine;
    },
    pathsTouched: (): readonly unknown[] => {
      const [tmpPath] = stagedPaths;
      if (typeof tmpPath !== 'string') {
        return [];
      }
      if (writeProxy.writtenContentsFor({ path: tmpPath }) === undefined) {
        return [];
      }
      return stagedPaths;
    },
  };
};
