import { join } from '#gateway/node/path';

import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath, GuildId, QuestId } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { fsRmAdapterProxy } from '../../../adapters/fs/rm/fs-rm-adapter.proxy';
import { questOutboxAppendBrokerProxy } from '../outbox-append/quest-outbox-append-broker.proxy';

export const questDeleteBrokerProxy = (): {
  setupQuestFolderPath: (params: {
    homePath: FilePath;
    guildId: GuildId;
    questId: QuestId;
    questFolderPath: FilePath;
  }) => void;
  setupRmFailure: (params: { error: Error }) => void;
  getRmCallArgs: () => readonly unknown[][];
  getAppendedContent: () => unknown;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const joinHandle = registerMock({ fn: join });
  const rmProxy = fsRmAdapterProxy();
  const outboxAppendProxy = questOutboxAppendBrokerProxy();

  const outboxFilePath = FilePathStub({
    value: '/home/testuser/.dungeonmaster/event-outbox.jsonl',
  });
  const questFolderPathRef: { value: FilePath } = { value: FilePathStub({ value: '/unset' }) };

  return {
    setupQuestFolderPath: ({
      homePath,
      guildId,
      questId,
      questFolderPath,
    }: {
      homePath: FilePath;
      guildId: GuildId;
      questId: QuestId;
      questFolderPath: FilePath;
    }): void => {
      questFolderPathRef.value = questFolderPath;
      homeFindProxy.setupHomePath({ homeDir: '/home/testuser', homePath });
      // questDeleteBroker's own five-segment join, addressed by the exact tuple rather than an
      // address-less FIFO slot, so it can never answer a different broker's join call sharing
      // the same underlying mocked `join`.
      joinHandle
        .calledWith([
          homePath,
          dungeonmasterHomeStatics.paths.guildsDir,
          guildId,
          dungeonmasterHomeStatics.paths.questsDir,
          questId,
        ])
        .returns(questFolderPath);
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
