/**
 * PURPOSE: Proxy for quest-get-blight-checklist-broker that mocks quest find/load, guild lookup,
 * repo-root resolution, and the git diff
 *
 * USAGE:
 * const proxy = questGetBlightChecklistBrokerProxy();
 * proxy.setupQuestFound({ quest });
 * proxy.setupDiff({ files: ['packages/web/src/widgets/foo/foo-widget.tsx'] });
 * proxy.setupQuestNotFound();
 */

import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildIdStub,
  GuildStub,
} from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';
import { cwdResolveBrokerProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { gitDiffFilesAdapterProxy } from '../../../adapters/git/diff-files/git-diff-files-adapter.proxy';
import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

const GUILD_PATH = '/home/testuser/my-guild';

export const questGetBlightChecklistBrokerProxy = (): {
  setupQuestFound: (params: { quest: Quest }) => void;
  setupQuestNotFound: () => void;
  setupDiff: (params: { files: readonly string[] }) => void;
  getGitDiffArgs: () => unknown;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const loadProxy = questLoadBrokerProxy();
  const guildProxy = guildGetBrokerProxy();
  const cwdProxy = cwdResolveBrokerProxy();
  const gitDiffProxy = gitDiffFilesAdapterProxy();

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

      pathJoinProxy.returns({ result: questFilePath });
      loadProxy.setupQuestFile({ questJson: JSON.stringify(quest) });

      guildProxy.setupDirectGuild({ guild: GuildStub({ id: guildId, path: GUILD_PATH }) });
      cwdProxy.setupRepoRootFoundAtStart({ startPath: GUILD_PATH });
    },

    setupQuestNotFound: (): void => {
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({ value: '/home/testuser/.dungeonmaster/guilds' });

      findQuestPathProxy.setupNoGuilds({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
      });
    },

    setupDiff: ({ files }: { files: readonly string[] }): void => {
      gitDiffProxy.setupDiffOutput({ output: files.join('\n') });
    },

    getGitDiffArgs: (): unknown => gitDiffProxy.getSpawnedArgs(),
  };
};
