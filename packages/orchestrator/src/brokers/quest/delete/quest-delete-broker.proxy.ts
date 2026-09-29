import { rmProxy } from '#gateway/node/fs__promises/rm/rm.proxy';
import { join } from '#gateway/node/path';

import type { FsError } from '#gateway/node/fs';
import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import type { FilePath, GuildId, QuestId } from '@dungeonmaster/shared/contracts';
import { dungeonmasterHomeStatics } from '@dungeonmaster/shared/statics';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { questOutboxAppendBrokerProxy } from '../outbox-append/quest-outbox-append-broker.proxy';

export const questDeleteBrokerProxy = (): {
  setupQuestFolderPath: (params: {
    homePath: FilePath;
    guildId: GuildId;
    questId: QuestId;
    questFolderPath: FilePath;
  }) => void;
  setupRmFailure: (params: { error: FsError }) => void;
  getRmCallArgs: () => readonly unknown[][];
  getAllRmCallArgs: () => readonly unknown[][];
  getAppendedContent: () => unknown;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const joinHandle = registerMock({ fn: join });
  const removeProxy = rmProxy();
  const outboxAppendProxy = questOutboxAppendBrokerProxy();

  const outboxFilePath = FilePathStub({
    value: '/home/testuser/.dungeonmaster/event-outbox.jsonl',
  });
  const questFolderPathRef: { value: FilePath } = { value: FilePathStub({ value: '/unset' }) };
  // Every quest folder `setupQuestFolderPath` has staged on this instance, for a composer that
  // deletes several quests in one call and reads every removal back together.
  const stagedFolderPaths = new Set<unknown>();
  const isStagedFolderPath = (value: unknown): boolean => stagedFolderPaths.has(value);

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
      stagedFolderPaths.add(questFolderPath);
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
      removeProxy.succeeds({ path: questFolderPath });
      outboxAppendProxy.setupOutboxAppend({ homePath, outboxFilePath });
    },

    setupRmFailure: ({ error }: { error: FsError }): void => {
      removeProxy.rejects({ path: questFolderPathRef.value, error });
    },

    getRmCallArgs: (): readonly unknown[][] =>
      removeProxy.getCallsFor({ path: questFolderPathRef.value }),

    // Every `rm` of any staged quest folder, in call order, as full `[path, options]` tuples.
    getAllRmCallArgs: (): readonly unknown[][] =>
      removeProxy.getCallsFor({ path: isStagedFolderPath }),

    getAppendedContent: (): unknown => outboxAppendProxy.getAppendedContent({ outboxFilePath }),
  };
};
