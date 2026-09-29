import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';

import { questFolderPathResolveBrokerProxy } from '../folder-path-resolve/quest-folder-path-resolve-broker.proxy';
import type { GuildListItemStub } from '@dungeonmaster/shared/contracts/guild-list-item/guild-list-item.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';

type GuildListItem = ReturnType<typeof GuildListItemStub>;
type Quest = ReturnType<typeof QuestStub>;

export const questWardResultDetailWriteBrokerProxy = (): {
  succeeds: ({
    guild,
    quest,
    wardResultFilePath,
  }: {
    guild: GuildListItem;
    quest: Quest;
    wardResultFilePath: string;
  }) => void;
  getWrittenContents: ({ wardResultFilePath }: { wardResultFilePath: string }) => unknown;
} => {
  const findGuildProxy = questFolderPathResolveBrokerProxy();
  const ensureDirHandle = ensureDirProxy();
  const writeProxy = writeFileProxy();

  return {
    succeeds: ({
      guild,
      quest,
      wardResultFilePath,
    }: {
      guild: GuildListItem;
      quest: Quest;
      wardResultFilePath: string;
    }): void => {
      findGuildProxy.succeeds({ guild, quest });
      const wardResultsDirPath = wardResultFilePath.slice(0, wardResultFilePath.lastIndexOf('/'));
      ensureDirHandle.succeeds({ path: wardResultsDirPath });
      writeProxy.succeeds({ path: wardResultFilePath });
    },
    getWrittenContents: ({ wardResultFilePath }: { wardResultFilePath: string }): unknown =>
      writeProxy.writtenContentsFor({ path: wardResultFilePath }),
  };
};
