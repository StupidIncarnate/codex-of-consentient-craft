import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { questFolderPathResolveBrokerProxy } from '../folder-path-resolve/quest-folder-path-resolve-broker.proxy';
import type { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

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
  const writeProxy = fsWriteFileAdapterProxy();

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
      writeProxy.succeeds({ filePath: questFilePath });
    },
    getWrittenContents: ({ questFilePath }: { questFilePath: string }): unknown =>
      writeProxy.getWrittenContents({ filePath: questFilePath }),
  };
};
