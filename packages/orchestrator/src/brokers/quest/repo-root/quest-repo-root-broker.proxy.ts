import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  GuildStub,
} from '@dungeonmaster/shared/contracts';
import type { QuestStub, RepoRootCwdStub } from '@dungeonmaster/shared/contracts';
import { cwdResolveBroker } from '@dungeonmaster/shared/brokers';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/testing';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;
type RepoRootCwd = ReturnType<typeof RepoRootCwdStub>;
type FilePath = ReturnType<typeof FilePathStub>;

const GUILD_PATH = FilePathStub({ value: '/home/testuser/my-guild' });

export const questRepoRootBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupResolveSuccess: (params: { repoRoot: RepoRootCwd }) => void;
  setupResolveRejects: () => void;
  getGuildPath: () => FilePath;
} => {
  // Wired to satisfy enforce-proxy-child-creation; the registerMock below replaces the broker
  // entirely so cwdResolveBrokerProxy's underlying fs/path mocks aren't actually exercised.
  cwdResolveBrokerProxy();
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const guildProxy = guildGetBrokerProxy();

  // questRepoRootBroker walks up from the guild path to the repo root via cwdResolveBroker.
  // startPath varies with whichever guild a test seeds, so `[]` is the honest address — the
  // outcome is chosen per test via setupResolveSuccess/setupResolveRejects below.
  const cwdResolveMock = registerMock({ fn: cwdResolveBroker });

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      const guildId = GuildIdStub();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' });
      const questsDirPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`,
      });
      const questFilePath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`,
      });

      findQuestPathProxy.setupQuestFound({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
        guilds: [
          {
            dirName: FileNameStub({ value: guildId }),
            questsDirPath,
            questFolders: [
              {
                folderName: FileNameStub({ value: quest.folder }),
                questFilePath,
                questFolderPath,
                contents: FileContentsStub({ value: JSON.stringify(quest) }),
              },
            ],
          },
        ],
      });

      guildProxy.setupDirectGuild({ guild: GuildStub({ id: guildId, path: GUILD_PATH }) });
    },

    setupResolveSuccess: ({ repoRoot }: { repoRoot: RepoRootCwd }): void => {
      cwdResolveMock.calledWith([]).resolves(repoRoot);
    },

    setupResolveRejects: (): void => {
      cwdResolveMock.calledWith([]).rejects(new Error('no .dungeonmaster.json ancestor'));
    },

    getGuildPath: (): FilePath => GUILD_PATH,
  };
};
