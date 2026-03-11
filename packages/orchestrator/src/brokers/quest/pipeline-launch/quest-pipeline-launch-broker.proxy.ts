import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import type { ExitCode } from '@dungeonmaster/shared/contracts';
import {
  FileContentsStub,
  FileNameStub,
  FilePathStub,
  GuildConfigStub,
  GuildIdStub,
  GuildStub,
} from '@dungeonmaster/shared/contracts';
import type { QuestStub } from '@dungeonmaster/shared/contracts';

import { guildGetBrokerProxy } from '../../guild/get/guild-get-broker.proxy';
import { questFindQuestPathBrokerProxy } from '../find-quest-path/quest-find-quest-path-broker.proxy';
import { questPipelineBrokerProxy } from '../pipeline/quest-pipeline-broker.proxy';

type Quest = ReturnType<typeof QuestStub>;

export const questPipelineLaunchBrokerProxy = (): {
  setupLaunch: (params: { quest: Quest; questJson: string; exitCode: ExitCode }) => void;
  setupQuestPathNotFound: () => void;
} => {
  const findQuestPathProxy = questFindQuestPathBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const guildProxy = guildGetBrokerProxy();
  const pipelineProxy = questPipelineBrokerProxy();

  return {
    setupLaunch: ({
      quest,
      questJson,
      exitCode,
    }: {
      quest: Quest;
      questJson: string;
      exitCode: ExitCode;
    }): void => {
      const guildId = GuildIdStub();
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds',
      });
      const questsDirPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests`,
      });
      const questFolderPath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}`,
      });
      const questFilePath = FilePathStub({
        value: `/home/testuser/.dungeonmaster/guilds/${guildId}/quests/${quest.folder}/quest.json`,
      });
      const guildPath = FilePathStub({ value: '/home/testuser/project' });

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

      // pathJoin for questPipelineLaunchBroker joining questPath + quest.json
      pathJoinProxy.returns({ result: questFilePath });

      const guild = GuildStub({ id: guildId, path: guildPath });
      guildProxy.setupConfig({
        config: GuildConfigStub({ guilds: [guild] }),
      });

      pipelineProxy.setupCodeweaverQuestLoad({ questJson });
      pipelineProxy.setupWardSuccessFirstTry({ exitCode });
      pipelineProxy.setupSiegemasterQuestFile({ questJson });
      pipelineProxy.setupSiegemasterSpawnsSucceed({ exitCode });
      pipelineProxy.setupLawbringerQuestFile({ questJson });
      pipelineProxy.setupLawbringerSpawnsSucceed({ exitCode });
    },

    setupQuestPathNotFound: (): void => {
      const homePath = FilePathStub({ value: '/home/testuser/.dungeonmaster' });
      const guildsDir = FilePathStub({
        value: '/home/testuser/.dungeonmaster/guilds',
      });

      findQuestPathProxy.setupNoGuilds({
        homeDir: '/home/testuser',
        homePath,
        guildsDir,
      });
    },
  };
};
