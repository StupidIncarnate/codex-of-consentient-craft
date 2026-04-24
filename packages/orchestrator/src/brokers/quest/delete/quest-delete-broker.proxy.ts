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

  return {
    setupQuestFolderPath: ({
      homePath,
      questFolderPath,
    }: {
      homePath: FilePath;
      questFolderPath: FilePath;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir: '/home/testuser', homePath });
      pathJoinProxy.returns({ result: questFolderPath });
      const outboxFilePath = FilePathStub({
        value: '/home/testuser/.dungeonmaster/event-outbox.jsonl',
      });
      outboxAppendProxy.setupOutboxAppend({ homePath, outboxFilePath });
    },

    setupRmFailure: ({ error }: { error: Error }): void => {
      rmProxy.throws({ error });
    },

    getRmCallArgs: (): readonly unknown[][] => rmProxy.getCallArgs(),

    getAppendedContent: (): unknown => outboxAppendProxy.getAppendedContent(),
  };
};
