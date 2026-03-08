import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import {
  FilePathStub,
  FileNameStub,
  FileContentsStub,
  QuestStub,
} from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { questPersistBrokerProxy } from '../../quest/persist/quest-persist-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../../quest/find-quest-path/quest-find-quest-path-broker.proxy';

const GUILD_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

export const designSessionWriteLayerBrokerProxy = (): {
  setupQuestWrite: (params: { questId: string; questContents: string }) => void;
  setupReadFailure: (params: { questId: string; error: Error }) => void;
  getWrittenContent: () => unknown;
  getWrittenPath: () => unknown;
} => {
  const findProxy = questFindQuestPathBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  const persistProxy = questPersistBrokerProxy();

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

      pathJoinProxy.returns({ result: questFilePath });
      readFileProxy.resolves({ content: questContents });
      persistProxy.setupPersist({
        homePath: FilePathStub({ value: '/home/testuser/.dungeonmaster' }),
        outboxFilePath: FilePathStub({ value: '/home/testuser/.dungeonmaster/outbox.jsonl' }),
      });
    },

    setupReadFailure: ({ questId, error }: { questId: string; error: Error }): void => {
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${GUILD_UUID}/quests/001-${questId}`,
      });
      const questFilePath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${GUILD_UUID}/quests/001-${questId}/quest.json`,
      });
      const quest = QuestStub({ id: questId, folder: `001-${questId}`, status: 'explore_design' });
      const questContents = JSON.stringify(quest);

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

      pathJoinProxy.returns({ result: questFilePath });
      readFileProxy.rejects({ error });
    },

    getWrittenContent: (): unknown => persistProxy.getWrittenContent(),
    getWrittenPath: (): unknown => persistProxy.getWrittenPath(),
  };
};
