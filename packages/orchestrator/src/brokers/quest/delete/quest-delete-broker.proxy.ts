import {
  dungeonmasterHomeFindBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';
import { questOutboxAppendBrokerProxy } from '../outbox-append/quest-outbox-append-broker.proxy';

export const questDeleteBrokerProxy = (): {
  setupQuestFolderPath: (params: { homePath: FilePath; questFolderPath: FilePath }) => void;
  setupRmFailure: (params: { error: Error }) => void;
  getRmCallArgs: () => readonly unknown[][];
  getAppendedContent: () => unknown;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const rmProxy = fsRmAdapterProxy();
  const outboxAppendProxy = questOutboxAppendBrokerProxy();

  const outboxFilePath = FilePathStub({
    value: '/home/testuser/.dungeonmaster/event-outbox.jsonl',
  });
  const questFolderPathRef: { value: FilePath } = { value: FilePathStub({ value: '/unset' }) };

  return {
    setupQuestFolderPath: ({
      homePath,
      questFolderPath,
    }: {
      homePath: FilePath;
      questFolderPath: FilePath;
    }): void => {
      questFolderPathRef.value = questFolderPath;
      homeFindProxy.setupHomePath({ homeDir: '/home/testuser', homePath });
      pathJoinProxy.returns({ result: questFolderPath });
      // fsRmAdapterProxy no longer has a constructor-level catch-all — this proxy silently
      // leaned on that removed default for the success path. Stage it explicitly, keyed on
      // the same questFolderPath the broker deletes.
      rmProxy.succeeds({ filePath: questFolderPath });
      outboxAppendProxy.setupOutboxAppend({ homePath, outboxFilePath });
    },

    setupRmFailure: ({ error }: { error: Error }): void => {
      rmProxy.throws({ filePath: questFolderPathRef.value, error });
    },

    getRmCallArgs: (): readonly unknown[][] =>
      rmProxy.getCallsFor({ filePath: questFolderPathRef.value }),

    getAppendedContent: (): unknown => outboxAppendProxy.getAppendedContent({ outboxFilePath }),
  };
};
