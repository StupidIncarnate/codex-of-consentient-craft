import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub, FileNameStub, FileContentsStub } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';

const GUILD_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

export const questSessionWriteLayerBrokerProxy = (): {
  setupQuestWrite: (params: { questId: string; questContents: string }) => void;
  getWrittenContent: () => unknown;
  getWrittenPath: () => unknown;
} => {
  const findProxy = questFindQuestPathBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();

  return {
    setupQuestWrite: ({
      questId,
      questContents,
    }: {
      questId: string;
      questContents: string;
    }): void => {
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${GUILD_UUID}/quests/001-${questId}`,
      });
      const questFilePath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${GUILD_UUID}/quests/001-${questId}/quest.json`,
      });

      findProxy.setupQuestFound({
        homeDir: '/home/testuser',
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        guildsDir: FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' }),
        guilds: [
          {
            dirName: FileNameStub({ value: GUILD_UUID }),
            questsDirPath: FilePathStub({
              value: `/home/testuser/.dungeonmaster/guilds/${GUILD_UUID}/quests`,
            }),
            questFolders: [
              {
                folderName: FileNameStub({ value: `001-${questId}` }),
                questFilePath,
                questFolderPath,
                contents: FileContentsStub({ value: questContents as never }),
              },
            ],
          },
        ],
      });

      // questSessionWriteLayerBroker: pathJoin(questPath, 'quest.json') -> questFilePath
      pathJoinProxy.returns({ result: questFilePath });

      // questSessionWriteLayerBroker: readFile(questFilePath) -> quest contents
      readFileProxy.resolves({ content: questContents });

      // questSessionWriteLayerBroker: writeFile(questFilePath, updated) -> success
      writeFileProxy.succeeds();
    },

    getWrittenContent: (): unknown => writeFileProxy.getWrittenContent(),
    getWrittenPath: (): unknown => writeFileProxy.getWrittenPath(),
  };
};
