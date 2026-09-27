import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { questFolderPathResolveBrokerProxy } from '../folder-path-resolve/quest-folder-path-resolve-broker.proxy';
import type { GuildListItemStub, QuestStub } from '@dungeonmaster/shared/contracts';

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
  const writeProxy = fsWriteFileAdapterProxy();

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
      writeProxy.succeeds({ filePath: wardResultFilePath });
    },
    getWrittenContents: ({ wardResultFilePath }: { wardResultFilePath: string }): unknown =>
      writeProxy.getWrittenContents({ filePath: wardResultFilePath }),
  };
};
