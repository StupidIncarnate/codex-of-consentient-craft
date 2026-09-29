import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { questFolderPathResolveBrokerProxy } from '../folder-path-resolve/quest-folder-path-resolve-broker.proxy';
import type { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;

export const questCorruptToLegacySchemaBrokerProxy = (): {
  succeeds: ({
    guild,
    quest,
    questFilePath,
  }: {
    guild: GuildListItem;
    quest: Quest;
    questFilePath: string;
  }) => void;
  getWrittenContents: ({ questFilePath }: { questFilePath: string }) => unknown;
} => {
  const findGuildProxy = questFolderPathResolveBrokerProxy();
  const writeProxy = writeFileProxy();

  return {
    succeeds: ({
      guild,
      quest,
      questFilePath,
    }: {
      guild: GuildListItem;
      quest: Quest;
      questFilePath: string;
    }): void => {
      findGuildProxy.succeeds({ guild, quest });
      writeProxy.succeeds({ path: questFilePath });
    },
    getWrittenContents: ({ questFilePath }: { questFilePath: string }): unknown =>
      writeProxy.writtenContentsFor({ path: questFilePath }),
  };
};
