import { FileContentsStub } from '@dungeonmaster/shared/contracts/file-contents/file-contents.stub';
import { FileNameStub } from '@dungeonmaster/shared/contracts/file-name/file-name.stub';
import { GuildIdStub } from '@dungeonmaster/shared/contracts/guild-id/guild-id.stub';
import { GuildStub } from '@dungeonmaster/shared/contracts/guild/guild.stub';
import type { QuestStub } from '@dungeonmaster/shared/contracts/quest/quest.stub';
import type { RepoRootCwdStub } from '@dungeonmaster/shared/contracts/repo-root-cwd/repo-root-cwd.stub';
import { cwdResolveBrokerProxy } from '@dungeonmaster/shared/brokers/cwd/resolve/cwd-resolve-broker.proxy';
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
type FilePath = string;

const GUILD_PATH = '/home/testuser/my-guild';

// Auto-mock so every caller resolves through one mocked module. `setupQuestFound` stages a
// passthrough to the real broker for that quest's id, so a test driving the quest-lookup + walk-up
// chain runs the real code; `setupRepoRoot` is for a COMPOSING proxy that only needs an answer, and
// whose own quest-path staging would otherwise be consumed twice by this broker's second quest
// lookup.
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

  const realMod = requireActual<{ questRepoRootBroker: typeof questRepoRootBroker }>({
    module: './quest-repo-root-broker',
  });
  const repoRootMock = registerMock({ fn: questRepoRootBroker });
  // Any `{ questId }` call, for the opt-in `setupRepoRoot` only.
  const isQuestIdInput = (input: unknown): boolean =>
    typeof input === 'object' && input !== null && 'questId' in input;

  return {
    setupQuestFound: ({ quest }: { quest: Quest }): void => {
      const guildId = GuildIdStub();
      const homePath = '/home/testuser/.dungeonmaster';
      const guildsDir = '/home/testuser/.dungeonmaster/guilds';
      const questsDirPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`;
      const questFolderPath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`;
      const questFilePath = `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`;

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

      repoRootMock
        .calledWith([{ questId: quest.id }])
        .implement(realMod.questRepoRootBroker as never);
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
      repoRootMock.calledWith([isQuestIdInput]).resolves(repoRoot);
    },

    getGuildPath: (): FilePath => GUILD_PATH,
  };
};
