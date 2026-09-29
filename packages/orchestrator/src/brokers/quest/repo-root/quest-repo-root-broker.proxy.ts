import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  GuildStub,
} from '@dungeonmaster/shared/contracts';
import type { QuestStub, RepoRootCwdStub } from '@dungeonmaster/shared/contracts';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/testing';
import {
  registerMock,
  registerModuleMock,
  requireActual,
} from '@dungeonmaster/testing/register-mock';

import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questRepoRootBroker } from './quest-repo-root-broker';

type Quest = ReturnType<typeof QuestStub>;
type RepoRootCwd = ReturnType<typeof RepoRootCwdStub>;
type FilePath = ReturnType<typeof FilePathStub>;

const GUILD_PATH = FilePathStub({ value: '/home/testuser/my-guild' });

// Auto-mock so every caller resolves through one mocked module. The default below is a passthrough
// to the real broker, so a test driving the quest-lookup + walk-up chain behaves exactly as before;
// `setupRepoRoot` is for a COMPOSING proxy that only needs an answer, and whose own quest-path
// staging would otherwise be consumed twice by this broker's second quest lookup.
registerModuleMock({ module: './quest-repo-root-broker' });

export const questRepoRootBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupResolveSuccess: (params: { repoRoot: RepoRootCwd }) => void;
  setupResolveRejects: () => void;
  setupRepoRoot: (params: { repoRoot: RepoRootCwd }) => void;
  getGuildPath: () => FilePath;
} => {
  const cwdProxy = cwdResolveBrokerProxy();
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const guildProxy = guildGetBrokerProxy();

  // `questId` varies per test and the passthrough runs the REAL lookup against whatever it
  // receives rather than answering a canned value, so there is no per-input address to stage —
  // `[]` is the honest, generic catch-all. setupRepoRoot stages at the same address afterwards,
  // which wins by being the more recent registration at equal specificity.
  const realMod = requireActual<{ questRepoRootBroker: typeof questRepoRootBroker }>({
    module: './quest-repo-root-broker',
  });
  const repoRootMock = registerMock({ fn: questRepoRootBroker });
  repoRootMock.calledWith([]).implement(realMod.questRepoRootBroker as never);

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
      const startPath = String(GUILD_PATH);
      const repoRootValue = String(repoRoot);
      if (repoRootValue === startPath) {
        cwdProxy.setupRepoRootFoundAtStart({ startPath });
        return;
      }
      cwdProxy.setupRepoRootFoundInParent({ startPath, repoRoot: repoRootValue });
    },

    setupResolveRejects: (): void => {
      cwdProxy.setupRepoRootNotFound({ startPath: String(GUILD_PATH) });
    },

    // Answers this broker outright for every questId, skipping the quest lookup and the walk-up.
    // Reach for this from a composing proxy whose own test seeds ONE quest-path staging that the
    // real chain would consume a second time; use setupQuestFound + setupResolveSuccess when the
    // chain itself is what the test is about.
    setupRepoRoot: ({ repoRoot }: { repoRoot: RepoRootCwd }): void => {
      repoRootMock.calledWith([]).resolves(repoRoot);
    },

    getGuildPath: (): FilePath => GUILD_PATH,
  };
};
